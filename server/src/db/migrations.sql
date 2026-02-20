-- =====================================================
-- MYSQL MIGRATIONS FOR POS CAFE SYSTEM
-- Format: Standard SQL with CUSTOM SEPARATOR
-- =====================================================

DROP TRIGGER IF EXISTS before_update_users;
---SPLIT---
CREATE TRIGGER before_update_users BEFORE UPDATE ON users FOR EACH ROW SET NEW.updated_at = NOW();
---SPLIT---

DROP TRIGGER IF EXISTS before_update_menus;
---SPLIT---
CREATE TRIGGER before_update_menus BEFORE UPDATE ON menus FOR EACH ROW SET NEW.updated_at = NOW();
---SPLIT---

DROP TRIGGER IF EXISTS before_update_transactions;
---SPLIT---
CREATE TRIGGER before_update_transactions BEFORE UPDATE ON transactions FOR EACH ROW SET NEW.updated_at = NOW();
---SPLIT---

-- =====================================================
-- STOCK REDUCTION TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trg_reduce_menu_stock;
---SPLIT---
CREATE TRIGGER trg_reduce_menu_stock
AFTER INSERT ON transaction_items
FOR EACH ROW
BEGIN
    DECLARE v_current_stock INT;
    DECLARE v_new_stock INT;

    SELECT current_stock INTO v_current_stock
    FROM menus
    WHERE id = NEW.menu_id;

    IF v_current_stock IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Menu item not found';
    END IF;

    SET v_new_stock = v_current_stock - NEW.qty;

    IF v_new_stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for menu item';
    END IF;

    UPDATE menus
    SET current_stock = v_new_stock
    WHERE id = NEW.menu_id;

    INSERT INTO menu_stock_history (menu_id, quantity_change, final_stock, change_type, transaction_id, notes, created_at)
    VALUES (NEW.menu_id, -(NEW.qty), v_new_stock, 'order', NEW.transaction_id, 'Auto reduction from order', NOW());
END;
---SPLIT---

DROP TRIGGER IF EXISTS trg_restore_menu_stock;
---SPLIT---
CREATE TRIGGER trg_restore_menu_stock
AFTER DELETE ON transaction_items
FOR EACH ROW
BEGIN
    DECLARE v_current_stock INT;
    DECLARE v_new_stock INT;

    SELECT current_stock INTO v_current_stock
    FROM menus
    WHERE id = OLD.menu_id;

    SET v_new_stock = v_current_stock + OLD.qty;

    UPDATE menus
    SET current_stock = v_new_stock
    WHERE id = OLD.menu_id;

    INSERT INTO menu_stock_history (menu_id, quantity_change, final_stock, change_type, transaction_id, notes, created_at)
    VALUES (OLD.menu_id, OLD.qty, v_new_stock, 'return', OLD.transaction_id, 'Stock restoration from cancelled item', NOW());
END;
---SPLIT---

-- =====================================================
-- VIEWS
-- =====================================================

CREATE OR REPLACE VIEW v_today_transactions AS
SELECT 
    t.id,
    t.outlet_id,
    o.name as outlet_name,
    t.table_id,
    t.cashier_id,
    e.name as cashier_name,
    t.total_price,
    COALESCE(SUM(p.amount_paid), 0) as total_paid,
    t.status,
    t.payment_status,
    t.created_at,
    t.total_items
FROM transactions t
LEFT JOIN outlets o ON t.outlet_id = o.id
LEFT JOIN employees e ON t.cashier_id = e.id
LEFT JOIN payments p ON t.id = p.transaction_id
WHERE DATE(t.created_at) = CURDATE()
GROUP BY t.id, t.outlet_id, o.name, t.table_id, t.cashier_id, e.name, t.total_price, t.status, t.payment_status, t.created_at, t.total_items
ORDER BY t.created_at DESC;
---SPLIT---

CREATE OR REPLACE VIEW v_active_menu AS
SELECT 
    m.id,
    m.outlet_id,
    o.name as outlet_name,
    m.name,
    m.price,
    m.description,
    m.image,
    m.is_available,
    m.current_stock,
    c.id as category_id,
    c.name as category_name,
    c.type as category_type
FROM menus m
LEFT JOIN outlets o ON m.outlet_id = o.id
JOIN categories c ON m.category_id = c.id
WHERE m.is_available = true
ORDER BY c.type DESC, c.name, m.name;
---SPLIT---

-- =====================================================
-- TABLES FOR REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS mv_daily_sales (
    sale_date DATE,
    outlet_id INT,
    outlet_name VARCHAR(255),
    total_transactions INT,
    total_revenue DECIMAL(15,2),
    gross_sales DECIMAL(15,2),
    total_tax DECIMAL(15,2),
    completed_transactions INT,
    pending_transactions INT,
    avg_transaction_value DECIMAL(15,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_daily_sales (sale_date, outlet_id)
);
---SPLIT---

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS refresh_daily_sales;
---SPLIT---
CREATE PROCEDURE refresh_daily_sales()
BEGIN
    TRUNCATE TABLE mv_daily_sales;

    INSERT INTO mv_daily_sales 
    (sale_date, outlet_id, outlet_name, total_transactions, total_revenue, gross_sales, total_tax, completed_transactions, pending_transactions, avg_transaction_value)
    SELECT 
        DATE(t.created_at) as sale_date,
        t.outlet_id,
        o.name as outlet_name,
        COUNT(t.id),
        SUM(CASE WHEN t.status = 'completed' THEN t.total_price ELSE 0 END),
        SUM(CASE WHEN t.status = 'completed' THEN t.subtotal ELSE 0 END),
        SUM(CASE WHEN t.status = 'completed' THEN t.tax_amount ELSE 0 END),
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END),
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END),
        AVG(CASE WHEN t.status = 'completed' THEN t.total_price END)
    FROM transactions t
    LEFT JOIN outlets o ON t.outlet_id = o.id
    WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    GROUP BY DATE(t.created_at), t.outlet_id, o.name;
END;
---SPLIT---

DROP PROCEDURE IF EXISTS add_payment;
---SPLIT---
CREATE PROCEDURE add_payment(
    IN p_transaction_id INT,
    IN p_payment_method VARCHAR(50),
    IN p_amount_paid DECIMAL(15,2),
    IN p_notes TEXT
)
BEGIN
    DECLARE v_transaction_total DECIMAL(15,2);
    DECLARE v_total_paid DECIMAL(15,2);
    DECLARE v_remaining DECIMAL(15,2);
    DECLARE v_change DECIMAL(15,2) DEFAULT 0;
    DECLARE v_next_sequence INT;
    DECLARE v_is_fully_paid BOOLEAN DEFAULT FALSE;

    SELECT total_price INTO v_transaction_total FROM transactions WHERE id = p_transaction_id;
    SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid FROM payments WHERE transaction_id = p_transaction_id;

    SET v_remaining = v_transaction_total - v_total_paid;

    IF p_amount_paid >= v_remaining THEN
        SET v_change = p_amount_paid - v_remaining;
        SET v_is_fully_paid = TRUE;
    END IF;

    SELECT COALESCE(MAX(payment_sequence), 0) + 1 INTO v_next_sequence FROM payments WHERE transaction_id = p_transaction_id;

    INSERT INTO payments (transaction_id, payment_sequence, payment_method, amount_paid, change_amount, status, notes, created_at, updated_at)
    VALUES (p_transaction_id, v_next_sequence, p_payment_method, p_amount_paid, v_change, 'completed', p_notes, NOW(), NOW());

    IF v_is_fully_paid THEN
        UPDATE transactions SET payment_status = 'paid', status = 'completed', updated_at = NOW() WHERE id = p_transaction_id;
    ELSE
        UPDATE transactions SET payment_status = 'partial', updated_at = NOW() WHERE id = p_transaction_id;
    END IF;

    SELECT 'Success' as message, v_change as change_amount, v_is_fully_paid as is_fully_paid;
END;
---SPLIT---