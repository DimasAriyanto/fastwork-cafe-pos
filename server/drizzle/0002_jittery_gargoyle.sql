CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone_number` varchar(50),
	`email` varchar(255),
	`address` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD `customer_id` int;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_customers_name` ON `customers` (`name`);--> statement-breakpoint
CREATE INDEX `idx_customers_phone` ON `customers` (`phone_number`);--> statement-breakpoint
CREATE INDEX `idx_customers_created_by` ON `customers` (`created_by`);--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_transactions_customer` ON `transactions` (`customer_id`);