CREATE TABLE `refresh_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role_id` int NOT NULL,
	`username` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`photo` varchar(255),
	`status` varchar(50) DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `outlets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(255) NOT NULL,
	`city` varchar(255),
	`province` varchar(255),
	`phone_number` varchar(50),
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outlets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outlet_id` int NOT NULL,
	`table_number` varchar(50) NOT NULL,
	`qr_code` text,
	`seats_capacity` int,
	`status` varchar(50) DEFAULT 'available',
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tables_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_outlet_table` UNIQUE(`outlet_id`,`table_number`)
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`date` date NOT NULL,
	`check_in` datetime,
	`check_out` datetime,
	`attendance_status` varchar(50) DEFAULT 'present',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_employee_date` UNIQUE(`employee_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`outlet_id` int DEFAULT 1,
	`name` varchar(255) NOT NULL,
	`position` varchar(100) NOT NULL,
	`image_path` varchar(255),
	`is_active` boolean DEFAULT true,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_employees_user` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) DEFAULT 'menu',
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `menu_recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menu_id` int NOT NULL,
	`raw_material_id` int NOT NULL,
	`quantity_needed` int NOT NULL DEFAULT 0,
	`unit` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_recipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_menu_material` UNIQUE(`menu_id`,`raw_material_id`)
);
--> statement-breakpoint
CREATE TABLE `menu_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menu_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`price_adjustment` int DEFAULT 0,
	`sku` varchar(100),
	`is_available` boolean DEFAULT true,
	CONSTRAINT `menu_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outlet_id` int,
	`name` varchar(255) NOT NULL,
	`category_id` int NOT NULL,
	`price` int NOT NULL,
	`description` text,
	`image` varchar(255),
	`is_available` boolean DEFAULT true,
	`has_variant` boolean DEFAULT false,
	`current_stock` int DEFAULT 0,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sub_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sub_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `toppings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outlet_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` int NOT NULL DEFAULT 0,
	`is_available` boolean DEFAULT true,
	`stock` int DEFAULT 0,
	CONSTRAINT `toppings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `raw_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outlet_id` int,
	`name` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`stock_in` int NOT NULL DEFAULT 0,
	`stock_out` int NOT NULL DEFAULT 0,
	`unit` varchar(50) NOT NULL,
	`min_stock` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `raw_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplier_id` int NOT NULL,
	`raw_material_id` int NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` int NOT NULL,
	`shipment_date` datetime NOT NULL,
	`received_date` datetime,
	`status` varchar(50) DEFAULT 'pending',
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(255) NOT NULL,
	`contact` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discount_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discount_id` int NOT NULL,
	`menu_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discount_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_discount_menu` UNIQUE(`discount_id`,`menu_id`)
);
--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	`start_date` datetime,
	`end_date` datetime,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_stock_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menu_id` int NOT NULL,
	`change_type` varchar(20) NOT NULL,
	`quantity_change` int NOT NULL,
	`final_stock` int NOT NULL,
	`transaction_id` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_stock_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_id` int NOT NULL,
	`payment_sequence` int NOT NULL,
	`payment_method` varchar(50) NOT NULL DEFAULT 'cash',
	`amount_paid` int NOT NULL,
	`change_amount` int NOT NULL DEFAULT 0,
	`status` varchar(50) NOT NULL DEFAULT 'completed',
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_item_toppings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_item_id` int NOT NULL,
	`topping_id` int NOT NULL,
	`price` int NOT NULL,
	CONSTRAINT `transaction_item_toppings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_id` int NOT NULL,
	`menu_id` int NOT NULL,
	`variant_id` int,
	`qty` int NOT NULL,
	`sub_total` int NOT NULL,
	`original_price` int NOT NULL,
	`discount_id` int,
	`discount_percentage` int DEFAULT 0,
	`final_price` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outlet_id` int NOT NULL,
	`table_id` int,
	`cashier_id` int,
	`subtotal` int NOT NULL,
	`tax_amount` int NOT NULL DEFAULT 0,
	`service_charge_amount` int NOT NULL DEFAULT 0,
	`discount_amount` int NOT NULL DEFAULT 0,
	`total_price` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`payment_status` varchar(50) NOT NULL DEFAULT 'unpaid',
	`total_items` int NOT NULL DEFAULT 0,
	`order_type` varchar(50) DEFAULT 'dine_in',
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outlets` ADD CONSTRAINT `outlets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tables` ADD CONSTRAINT `tables_outlet_id_outlets_id_fk` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tables` ADD CONSTRAINT `tables_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_recipes` ADD CONSTRAINT `menu_recipes_menu_id_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_recipes` ADD CONSTRAINT `menu_recipes_raw_material_id_raw_materials_id_fk` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_variants` ADD CONSTRAINT `menu_variants_menu_id_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menus` ADD CONSTRAINT `menus_outlet_id_outlets_id_fk` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menus` ADD CONSTRAINT `menus_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menus` ADD CONSTRAINT `menus_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sub_categories` ADD CONSTRAINT `sub_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toppings` ADD CONSTRAINT `toppings_outlet_id_outlets_id_fk` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raw_materials` ADD CONSTRAINT `raw_materials_outlet_id_outlets_id_fk` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_raw_material_id_raw_materials_id_fk` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discount_items` ADD CONSTRAINT `discount_items_discount_id_discounts_id_fk` FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discount_items` ADD CONSTRAINT `discount_items_menu_id_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_stock_history` ADD CONSTRAINT `menu_stock_history_menu_id_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_stock_history` ADD CONSTRAINT `menu_stock_history_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_item_toppings` ADD CONSTRAINT `fk_ti_toppings_item` FOREIGN KEY (`transaction_item_id`) REFERENCES `transaction_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_item_toppings` ADD CONSTRAINT `fk_ti_toppings_ref_v2` FOREIGN KEY (`topping_id`) REFERENCES `toppings`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_menu_id_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_variant_id_menu_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `menu_variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_discount_id_discounts_id_fk` FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_outlet_id_outlets_id_fk` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_table_id_tables_id_fk` FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_cashier_id_employees_id_fk` FOREIGN KEY (`cashier_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_refresh_tokens_user` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_refresh_tokens_expires` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role_id`);--> statement-breakpoint
CREATE INDEX `idx_users_status` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `idx_outlets_created_by` ON `outlets` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_tables_outlet` ON `tables` (`outlet_id`);--> statement-breakpoint
CREATE INDEX `idx_tables_created_by` ON `tables` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_attendances_employee` ON `attendances` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_attendances_date` ON `attendances` (`date`);--> statement-breakpoint
CREATE INDEX `idx_employees_outlet` ON `employees` (`outlet_id`);--> statement-breakpoint
CREATE INDEX `idx_employees_created_by` ON `employees` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_employees_name` ON `employees` (`name`);--> statement-breakpoint
CREATE INDEX `idx_employees_position` ON `employees` (`position`);--> statement-breakpoint
CREATE INDEX `idx_categories_created_by` ON `categories` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_menu_recipes_menu` ON `menu_recipes` (`menu_id`);--> statement-breakpoint
CREATE INDEX `idx_menu_recipes_raw_material` ON `menu_recipes` (`raw_material_id`);--> statement-breakpoint
CREATE INDEX `idx_menus_category` ON `menus` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_menus_outlet` ON `menus` (`outlet_id`);--> statement-breakpoint
CREATE INDEX `idx_menus_created_by` ON `menus` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_menus_available` ON `menus` (`is_available`);--> statement-breakpoint
CREATE INDEX `idx_raw_materials_outlet` ON `raw_materials` (`outlet_id`);--> statement-breakpoint
CREATE INDEX `idx_shipments_supplier` ON `shipments` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `idx_shipments_raw_material` ON `shipments` (`raw_material_id`);--> statement-breakpoint
CREATE INDEX `idx_discount_items_discount` ON `discount_items` (`discount_id`);--> statement-breakpoint
CREATE INDEX `idx_discount_items_menu` ON `discount_items` (`menu_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_transaction` ON `payments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_method_date` ON `payments` (`payment_method`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_transaction_items_transaction` ON `transaction_items` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_transaction_items_menu` ON `transaction_items` (`menu_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_outlet` ON `transactions` (`outlet_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_cashier` ON `transactions` (`cashier_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_table` ON `transactions` (`table_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_status_date` ON `transactions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_transactions_payment_status` ON `transactions` (`payment_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_transactions_created_at_desc` ON `transactions` (`created_at`);