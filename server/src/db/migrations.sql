/**
 * SQL Migrations untuk POS Cafe System
 * File ini berisi semua functions, triggers, views, dan materialized views
 * yang didefinisikan di schema-table.sql dan optimization-query.sql
 * 
 * CATATAN: Jalankan file ini setelah drizzle migrations
 */

-- =====================================================
-- 1. AUTO UPDATE TIMESTAMP TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON outlets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taxes_updated_at BEFORE UPDATE ON taxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 1.5. ADVANCED INDEXES FOR POS OPERATIONS
-- =====================================================

-- Index untuk Open Bill (pesanan belum dibayar) - HIGH PRIORITY
CREATE INDEX IF NOT EXISTS idx_transactions_open_bill ON transactions(status, payment_status, created_at DESC) 
WHERE status = 'pending' OR payment_status = 'unpaid';

-- Index untuk transaksi hari ini - HIGH PRIORITY
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_desc ON transactions(created_at DESC);

-- Index untuk filter transaksi by date range
CREATE INDEX IF NOT EXISTS idx_transactions_date_range_status ON transactions(DATE(created_at), status);

-- Index untuk transaksi by status dan payment
CREATE INDEX IF NOT EXISTS idx_transactions_status_date ON transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status, created_at DESC);

-- Index untuk transaksi by kasir
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_date ON transactions(cashier_id, created_at DESC);

-- Index untuk transaksi by outlet
CREATE INDEX IF NOT EXISTS idx_transactions_outlet_date ON transactions(outlet_id, created_at DESC);

-- Index untuk menu yang tersedia (kasir input order)
CREATE INDEX IF NOT EXISTS idx_menus_available_category ON menus(is_available, category_id);

-- Index untuk pencarian menu by name (full text search)
CREATE INDEX IF NOT EXISTS idx_menus_name_search ON menus USING gin(to_tsvector('indonesian', name));

-- Index untuk payment method dan date (laporan)
CREATE INDEX IF NOT EXISTS idx_payments_method_date ON payments(payment_method, created_at DESC);

-- Index untuk transaction items with included columns (faster struk generation)
CREATE INDEX IF NOT EXISTS idx_transaction_items_detail ON transaction_items(transaction_id) 
INCLUDE (menu_id, qty, sub_total, final_price);

-- Index untuk discount active period
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(start_date, end_date, is_active) 
WHERE is_active = true;

-- =====================================================
-- 2. STOCK REDUCTION TRIGGERS
-- ====================================================="

CREATE OR REPLACE FUNCTION reduce_menu_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT current_stock INTO v_current_stock
    FROM menus
    WHERE id = NEW.menu_id;

    IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Menu item not found';
    END IF;

    -- Calculate new stock
    v_new_stock := v_current_stock - NEW.qty;

    -- Check if stock is sufficient
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for menu item %', NEW.menu_id;
    END IF;

    -- Update menu stock
    UPDATE menus
    SET current_stock = v_new_stock
    WHERE id = NEW.menu_id;

    -- Record stock history
    INSERT INTO menu_stock_history (menu_id, quantity_change, final_stock, change_type, transaction_id, notes)
    VALUES (NEW.menu_id, -NEW.qty, v_new_stock, 'order', NEW.transaction_id, 'Auto reduction from order');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reduce_menu_stock
AFTER INSERT ON transaction_items
FOR EACH ROW
EXECUTE FUNCTION reduce_menu_stock();

-- Function: Restore stock saat transaction item dihapus (cancel order)
CREATE OR REPLACE FUNCTION restore_menu_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT current_stock INTO v_current_stock
    FROM menus
    WHERE id = OLD.menu_id;

    IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Menu item not found';
    END IF;

    -- Calculate new stock (restore)
    v_new_stock := v_current_stock + OLD.qty;

    -- Update menu stock
    UPDATE menus
    SET current_stock = v_new_stock
    WHERE id = OLD.menu_id;

    -- Record stock history
    INSERT INTO menu_stock_history (menu_id, quantity_change, final_stock, change_type, transaction_id, notes)
    VALUES (OLD.menu_id, OLD.qty, v_new_stock, 'return', OLD.transaction_id, 'Stock restoration from cancelled item');

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restore_menu_stock
AFTER DELETE ON transaction_items
FOR EACH ROW
EXECUTE FUNCTION restore_menu_stock();

-- =====================================================
-- 3. HELPER FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function: Check if discount is currently active
CREATE OR REPLACE FUNCTION is_discount_active(p_discount_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_active BOOLEAN;
    v_start_date TIMESTAMP;
    v_end_date TIMESTAMP;
BEGIN
    SELECT is_active, start_date, end_date
    INTO v_is_active, v_start_date, v_end_date
    FROM discounts
    WHERE id = p_discount_id;

    IF v_is_active IS NULL THEN
        RETURN false;
    END IF;

    IF NOT v_is_active THEN
        RETURN false;
    END IF;

    IF v_start_date IS NOT NULL AND CURRENT_TIMESTAMP < v_start_date THEN
        RETURN false;
    END IF;

    IF v_end_date IS NOT NULL AND CURRENT_TIMESTAMP > v_end_date THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Get active tax rate by category
CREATE OR REPLACE FUNCTION get_active_tax_rate(p_category VARCHAR DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
    v_percentage DECIMAL;
BEGIN
    SELECT percentage INTO v_percentage
    FROM taxes
    WHERE is_active = true
      AND (p_category IS NULL OR category = p_category)
    LIMIT 1;

    RETURN COALESCE(v_percentage, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ADVANCED BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Function: Create Order with Items (Bulk Insert)
CREATE OR REPLACE FUNCTION create_order_with_items(
    p_outlet_id INTEGER,
    p_table_id INTEGER,
    p_cashier_id INTEGER,
    p_items JSONB,
    p_order_type VARCHAR DEFAULT 'dine_in'
)
RETURNS TABLE(
    transaction_id INTEGER, 
    subtotal DECIMAL, 
    tax_amount DECIMAL,
    service_amount DECIMAL,
    total_price DECIMAL
) AS $$
DECLARE
    v_transaction_id INTEGER;
    v_subtotal DECIMAL := 0;
    v_tax_amount DECIMAL;
    v_service_charge_amount DECIMAL;
    v_total DECIMAL;
    v_item_count INTEGER;
    v_tax_percentage DECIMAL;
    v_service_percentage DECIMAL;
BEGIN
    -- Get active tax rates from database
    SELECT get_active_tax_rate('general') INTO v_tax_percentage;
    SELECT get_active_tax_rate('service') INTO v_service_percentage;
    
    -- Use defaults if no active tax found
    v_tax_percentage := COALESCE(v_tax_percentage, 10);
    v_service_percentage := COALESCE(v_service_percentage, 5);
    
    -- Calculate subtotal from items with discount
    SELECT 
        SUM((item->>'qty')::INTEGER * (item->>'price')::DECIMAL * 
            (1 - COALESCE((item->>'discount_percentage')::DECIMAL, 0) / 100)),
        COUNT(*)
    INTO v_subtotal, v_item_count
    FROM jsonb_array_elements(p_items) as item;
    
    -- Calculate tax and service charge
    v_tax_amount := v_subtotal * v_tax_percentage / 100;
    v_service_charge_amount := v_subtotal * v_service_percentage / 100;
    v_total := v_subtotal + v_tax_amount + v_service_charge_amount;
    
    -- Insert transaction
    INSERT INTO transactions (
        outlet_id, table_id, cashier_id, subtotal, tax_amount, 
        service_charge_amount, total_price, payment_status, total_items, order_type, created_at, updated_at
    )
    VALUES (
        p_outlet_id, p_table_id, p_cashier_id, v_subtotal, v_tax_amount, 
        v_service_charge_amount, v_total, 'unpaid', v_item_count, p_order_type, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_transaction_id;
    
    -- Bulk insert transaction items
    -- Note: Stock reduction handled automatically by trigger
    INSERT INTO transaction_items (
        transaction_id, menu_id, qty, sub_total, 
        original_price, discount_percentage, final_price
    )
    SELECT 
        v_transaction_id,
        (item->>'menu_id')::INTEGER,
        (item->>'qty')::INTEGER,
        (item->>'qty')::INTEGER * (item->>'price')::DECIMAL,
        (item->>'price')::DECIMAL,
        COALESCE((item->>'discount_percentage')::DECIMAL, 0),
        (item->>'qty')::INTEGER * (item->>'price')::DECIMAL * 
            (1 - COALESCE((item->>'discount_percentage')::DECIMAL, 0) / 100)
    FROM jsonb_array_elements(p_items) as item;
    
    -- Return transaction summary
    RETURN QUERY 
    SELECT v_transaction_id, v_subtotal, v_tax_amount, v_service_charge_amount, v_total;
END;
$$ LANGUAGE plpgsql;

-- Function: Add Payment (Support Multiple Payments / Installments)
CREATE OR REPLACE FUNCTION add_payment(
    p_transaction_id INTEGER,
    p_payment_method VARCHAR(50),
    p_amount_paid DECIMAL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    payment_id INTEGER,
    remaining_balance DECIMAL,
    change_amount DECIMAL,
    is_fully_paid BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_transaction_total DECIMAL;
    v_total_paid DECIMAL := 0;
    v_remaining DECIMAL;
    v_change DECIMAL := 0;
    v_payment_id INTEGER;
    v_next_sequence INTEGER;
    v_is_fully_paid BOOLEAN := false;
BEGIN
    -- Get transaction total
    SELECT total_price INTO v_transaction_total
    FROM transactions
    WHERE id = p_transaction_id;
    
    IF v_transaction_total IS NULL THEN
        RETURN QUERY SELECT false, NULL::INTEGER, 0::DECIMAL, 0::DECIMAL, false, 'Transaction not found';
        RETURN;
    END IF;
    
    -- Calculate total already paid
    SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
    FROM payments
    WHERE transaction_id = p_transaction_id;
    
    -- Calculate remaining balance
    v_remaining := v_transaction_total - v_total_paid;
    
    -- Check if already fully paid
    IF v_remaining <= 0 THEN
        RETURN QUERY SELECT false, NULL::INTEGER, 0::DECIMAL, 0::DECIMAL, true, 'Transaction already fully paid';
        RETURN;
    END IF;
    
    -- Get next payment sequence
    SELECT COALESCE(MAX(payment_sequence), 0) + 1 INTO v_next_sequence
    FROM payments
    WHERE transaction_id = p_transaction_id;
    
    -- Calculate change if overpayment
    IF p_amount_paid > v_remaining THEN
        v_change := p_amount_paid - v_remaining;
        v_is_fully_paid := true;
    ELSIF p_amount_paid = v_remaining THEN
        v_is_fully_paid := true;
    END IF;
    
    -- Insert payment record
    INSERT INTO payments (
        transaction_id, payment_sequence, payment_method, 
        amount_paid, change_amount, status, notes, created_at, updated_at
    )
    VALUES (
        p_transaction_id, v_next_sequence, p_payment_method, 
        p_amount_paid, v_change, 'completed', p_notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_payment_id;
    
    -- Update transaction payment status if fully paid
    IF v_is_fully_paid THEN
        UPDATE transactions
        SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_transaction_id;
    ELSE
        UPDATE transactions
        SET payment_status = 'partial', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_transaction_id;
    END IF;
    
    RETURN QUERY SELECT true, v_payment_id, GREATEST(0, v_remaining - p_amount_paid), v_change, v_is_fully_paid, 'Payment recorded successfully';
END;
$$ LANGUAGE plpgsql;

-- Function: Complete Payment (Cash / QRIS) - DEPRECATED, use add_payment instead
-- Kept for backward compatibility
CREATE OR REPLACE FUNCTION complete_payment(
    p_transaction_id INTEGER,
    p_payment_method VARCHAR(50),
    p_amount_paid DECIMAL,
    p_calculate_change BOOLEAN DEFAULT true
)
RETURNS TABLE(
    success BOOLEAN,
    change_amount DECIMAL,
    receipt_data JSONB
) AS $$
DECLARE
    v_result RECORD;
    v_receipt JSONB;
BEGIN
    -- Use new add_payment function
    SELECT * INTO v_result
    FROM add_payment(p_transaction_id, p_payment_method, p_amount_paid);
    
    IF NOT v_result.success THEN
        RETURN QUERY SELECT false, 0::DECIMAL, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Generate receipt data
    SELECT get_transaction_receipt(p_transaction_id) INTO v_receipt;
    
    RETURN QUERY SELECT true, v_result.change_amount, v_receipt;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Transaction Receipt (untuk print struk)
CREATE OR REPLACE FUNCTION get_transaction_receipt(p_transaction_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_receipt JSONB;
BEGIN
    SELECT jsonb_build_object(
        'transaction', jsonb_build_object(
            'id', t.id,
            'outlet', o.name,
            'table_number', tb.table_number,
            'cashier', e.name,
            'order_type', t.order_type,
            'created_at', t.created_at,
            'total_items', t.total_items
        ),
        'items', jsonb_agg(
            jsonb_build_object(
                'menu_name', m.name,
                'qty', ti.qty,
                'original_price', ti.original_price,
                'discount_percentage', ti.discount_percentage,
                'final_price', ti.final_price
            )
        ),
        'summary', jsonb_build_object(
            'subtotal', t.subtotal,
            'tax_amount', t.tax_amount,
            'service_charge_amount', t.service_charge_amount,
            'discount_amount', t.discount_amount,
            'total_price', t.total_price,
            'payment_status', t.payment_status
        ),
        'payments', jsonb_agg(
            jsonb_build_object(
                'payment_method', p.payment_method,
                'amount_paid', p.amount_paid,
                'change_amount', p.change_amount
            )
        ) FILTER (WHERE p.id IS NOT NULL)
    ) INTO v_receipt
    FROM transactions t
    LEFT JOIN outlets o ON t.outlet_id = o.id
    LEFT JOIN tables tb ON t.table_id = tb.id
    LEFT JOIN employees e ON t.cashier_id = e.id
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN menus m ON ti.menu_id = m.id
    LEFT JOIN payments p ON t.id = p.transaction_id
    WHERE t.id = p_transaction_id
    GROUP BY t.id, o.name, tb.table_number, e.name;
    
    RETURN v_receipt;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Transactions by Date Range (Filter)
CREATE OR REPLACE FUNCTION get_transactions_by_date_range(
    p_start_date DATE,
    p_end_date DATE,
    p_outlet_id INTEGER DEFAULT NULL,
    p_cashier_id INTEGER DEFAULT NULL,
    p_status VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(
    transaction_id INTEGER,
    outlet_name VARCHAR(255),
    table_number VARCHAR(50),
    cashier_name VARCHAR(255),
    total_price DECIMAL,
    total_paid DECIMAL,
    payment_status VARCHAR(20),
    status VARCHAR(50),
    transaction_date TIMESTAMP,
    total_items INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        o.name,
        tb.table_number,
        e.name,
        t.total_price,
        COALESCE(SUM(p.amount_paid), 0)::DECIMAL,
        t.payment_status,
        t.status,
        t.created_at,
        t.total_items
    FROM transactions t
    LEFT JOIN outlets o ON t.outlet_id = o.id
    LEFT JOIN tables tb ON t.table_id = tb.id
    LEFT JOIN employees e ON t.cashier_id = e.id
    LEFT JOIN payments p ON t.id = p.transaction_id
    WHERE DATE(t.created_at) BETWEEN p_start_date AND p_end_date
      AND (p_outlet_id IS NULL OR t.outlet_id = p_outlet_id)
      AND (p_cashier_id IS NULL OR t.cashier_id = p_cashier_id)
      AND (p_status IS NULL OR t.status = p_status)
    GROUP BY t.id, o.name, tb.table_number, e.name, t.total_price, 
             t.payment_status, t.status, t.created_at, t.total_items
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Best Selling Menu
CREATE OR REPLACE FUNCTION get_best_selling_menu(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_outlet_id INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    menu_id INTEGER,
    menu_name VARCHAR,
    category_name VARCHAR,
    outlet_name VARCHAR,
    total_orders BIGINT,
    total_quantity NUMERIC,
    total_revenue NUMERIC,
    avg_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        c.name,
        o.name,
        COUNT(DISTINCT ti.transaction_id)::BIGINT,
        SUM(ti.qty)::NUMERIC,
        SUM(ti.final_price)::NUMERIC,
        AVG(ti.final_price / ti.qty)::NUMERIC
    FROM transaction_items ti
    JOIN menus m ON ti.menu_id = m.id
    JOIN categories c ON m.category_id = c.id
    LEFT JOIN outlets o ON m.outlet_id = o.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE DATE(t.created_at) BETWEEN p_start_date AND p_end_date
      AND (p_outlet_id IS NULL OR m.outlet_id = p_outlet_id)
    GROUP BY m.id, m.name, c.name, o.name
    ORDER BY SUM(ti.final_price) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Payment Summary by Method
CREATE OR REPLACE FUNCTION get_payment_summary(
    p_start_date DATE,
    p_end_date DATE,
    p_outlet_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    payment_method VARCHAR,
    total_transactions BIGINT,
    total_amount NUMERIC,
    avg_amount NUMERIC,
    net_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.payment_method,
        COUNT(DISTINCT p.transaction_id)::BIGINT,
        SUM(p.amount_paid)::NUMERIC,
        AVG(p.amount_paid)::NUMERIC,
        (SUM(p.amount_paid) - SUM(p.change_amount))::NUMERIC
    FROM payments p
    JOIN transactions t ON p.transaction_id = t.id
    WHERE DATE(t.created_at) BETWEEN p_start_date AND p_end_date
      AND (p_outlet_id IS NULL OR t.outlet_id = p_outlet_id)
    GROUP BY p.payment_method
    ORDER BY SUM(p.amount_paid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Adjust Menu Stock Manually
CREATE OR REPLACE FUNCTION adjust_menu_stock(
    p_menu_id INTEGER,
    p_quantity_change INTEGER,
    p_change_type VARCHAR DEFAULT 'adjustment',
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    new_stock INTEGER,
    message TEXT
) AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT current_stock INTO v_current_stock
    FROM menus
    WHERE id = p_menu_id;

    IF v_current_stock IS NULL THEN
        RETURN QUERY SELECT false, 0, 'Menu item not found';
        RETURN;
    END IF;

    -- Calculate new stock
    v_new_stock := v_current_stock + p_quantity_change;

    IF v_new_stock < 0 THEN
        RETURN QUERY SELECT false, v_current_stock, 'Stock cannot be negative';
        RETURN;
    END IF;

    -- Update menu stock
    UPDATE menus
    SET current_stock = v_new_stock, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_menu_id;

    -- Record stock history with new schema
    INSERT INTO menu_stock_history (menu_id, quantity_change, final_stock, change_type, notes, created_at)
    VALUES (p_menu_id, p_quantity_change, v_new_stock, p_change_type, COALESCE(p_notes, 'Stock adjustment'), CURRENT_TIMESTAMP);

    RETURN QUERY SELECT true, v_new_stock, 'Stock adjusted successfully';
END;
$$ LANGUAGE plpgsql;

-- Function: Cancel Transaction
CREATE OR REPLACE FUNCTION cancel_transaction(
    p_transaction_id INTEGER,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_payment_count INTEGER;
BEGIN
    -- Check if transaction has payments
    SELECT COUNT(*) INTO v_payment_count
    FROM payments
    WHERE transaction_id = p_transaction_id;

    IF v_payment_count > 0 THEN
        RETURN QUERY SELECT false, 'Cannot cancel transaction with existing payments';
        RETURN;
    END IF;

    -- Delete transaction items (this will trigger stock restoration)
    DELETE FROM transaction_items
    WHERE transaction_id = p_transaction_id;

    -- Mark transaction as cancelled
    UPDATE transactions
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP, notes = COALESCE(p_reason, notes)
    WHERE id = p_transaction_id;

    RETURN QUERY SELECT true, 'Transaction cancelled successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VIEWS FOR DASHBOARD & REPORTING
-- =====================================================

-- View: Open Bills (Pesanan Belum Dibayar)
CREATE OR REPLACE VIEW v_open_bills AS
SELECT 
    t.id,
    t.outlet_id,
    o.name as outlet_name,
    t.table_id,
    tb.table_number,
    t.total_price,
    COALESCE(SUM(p.amount_paid), 0) as total_paid,
    t.total_price - COALESCE(SUM(p.amount_paid), 0) as remaining_balance,
    t.payment_status,
    t.created_at,
    t.total_items,
    jsonb_agg(
        jsonb_build_object(
            'menu_name', m.name,
            'qty', ti.qty,
            'price', ti.final_price
        )
    ) as items
FROM transactions t
LEFT JOIN outlets o ON t.outlet_id = o.id
LEFT JOIN tables tb ON t.table_id = tb.id
LEFT JOIN payments p ON t.id = p.transaction_id
JOIN transaction_items ti ON t.id = ti.transaction_id
JOIN menus m ON ti.menu_id = m.id
WHERE t.payment_status IN ('unpaid', 'partial')
  AND t.status = 'pending'
GROUP BY t.id, t.outlet_id, o.name, t.table_id, tb.table_number, 
         t.total_price, t.payment_status, t.created_at, t.total_items
ORDER BY t.created_at DESC;

-- View: Today Transactions
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
WHERE DATE(t.created_at) = CURRENT_DATE
GROUP BY t.id, t.outlet_id, o.name, t.table_id, t.cashier_id, 
         e.name, t.total_price, t.status, t.payment_status, 
         t.created_at, t.total_items
ORDER BY t.created_at DESC;

-- View: Active Menu (untuk input order kasir)
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
    m.preparation_time,
    c.id as category_id,
    c.name as category_name,
    c.type as category_type
FROM menus m
LEFT JOIN outlets o ON m.outlet_id = o.id
JOIN categories c ON m.category_id = c.id
WHERE m.is_available = true
ORDER BY c.type DESC, c.name, m.name;

-- View: Available Toppings
CREATE OR REPLACE VIEW v_available_toppings AS
SELECT 
    m.id,
    m.outlet_id,
    o.name as outlet_name,
    m.name,
    m.price,
    m.description,
    m.is_available,
    c.id as category_id,
    c.name as category_name
FROM menus m
LEFT JOIN outlets o ON m.outlet_id = o.id
JOIN categories c ON m.category_id = c.id
WHERE m.is_available = true
  AND c.type = 'topping'
ORDER BY m.name;

-- =====================================================
-- 6. MATERIALIZED VIEWS FOR REPORTS
-- =====================================================

-- Materialized View: Daily Sales Report
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT 
    DATE(t.created_at) as sale_date,
    t.outlet_id,
    o.name as outlet_name,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.status = 'completed' THEN t.total_price ELSE 0 END) as total_revenue,
    SUM(CASE WHEN t.status = 'completed' THEN t.subtotal ELSE 0 END) as gross_sales,
    SUM(CASE WHEN t.status = 'completed' THEN t.tax_amount ELSE 0 END) as total_tax,
    SUM(CASE WHEN t.status = 'completed' THEN t.service_charge_amount ELSE 0 END) as total_service_charge,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_transactions,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_transactions,
    COUNT(DISTINCT t.cashier_id) as active_cashiers,
    AVG(CASE WHEN t.status = 'completed' THEN t.total_price END) as avg_transaction_value
FROM transactions t
LEFT JOIN outlets o ON t.outlet_id = o.id
WHERE t.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(t.created_at), t.outlet_id, o.name
WITH DATA;

CREATE UNIQUE INDEX idx_mv_daily_sales_date_outlet 
ON mv_daily_sales(sale_date DESC, outlet_id);

-- Materialized View: Monthly Sales Report
CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT 
    DATE_TRUNC('month', t.created_at) as sale_month,
    t.outlet_id,
    o.name as outlet_name,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.status = 'completed' THEN t.total_price ELSE 0 END) as total_revenue,
    SUM(CASE WHEN t.status = 'completed' THEN t.subtotal ELSE 0 END) as gross_sales,
    SUM(CASE WHEN t.status = 'completed' THEN t.tax_amount ELSE 0 END) as total_tax,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_transactions,
    AVG(CASE WHEN t.status = 'completed' THEN t.total_price END) as avg_transaction_value
FROM transactions t
LEFT JOIN outlets o ON t.outlet_id = o.id
WHERE t.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', t.created_at), t.outlet_id, o.name
WITH DATA;

CREATE UNIQUE INDEX idx_mv_monthly_sales_month_outlet 
ON mv_monthly_sales(sale_month DESC, outlet_id);

-- Function: Refresh Sales Reports
CREATE OR REPLACE FUNCTION refresh_sales_reports()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_sales;
    RAISE NOTICE 'Sales reports refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'User authentication and basic profile';
COMMENT ON TABLE employees IS 'Employee details linked to users';
COMMENT ON TABLE menus IS 'Menu items available at outlets';
COMMENT ON TABLE menu_recipes IS 'Recipe ingredients for each menu item';
COMMENT ON TABLE transactions IS 'Customer orders and transactions';
COMMENT ON TABLE transaction_items IS 'Individual items in each transaction';
COMMENT ON TABLE payments IS 'Payment records supporting installments';
COMMENT ON TABLE raw_materials IS 'Raw materials inventory';
COMMENT ON TABLE attendances IS 'Employee attendance records';
COMMENT ON TABLE discounts IS 'Discount campaigns and promotions';
COMMENT ON TABLE menu_stock_history IS 'Audit trail for menu stock changes';

COMMENT ON COLUMN raw_materials.stock_in IS 'Total stock received (incoming)';
COMMENT ON COLUMN raw_materials.stock_out IS 'Total stock used/sold (outgoing)';
COMMENT ON COLUMN payments.payment_sequence IS 'Sequence number for installment payments';
COMMENT ON COLUMN categories.type IS 'Category type: menu or topping';
