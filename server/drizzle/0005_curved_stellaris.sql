ALTER TABLE `transactions` ADD `manual_discount_type` varchar(20);--> statement-breakpoint
ALTER TABLE `transactions` ADD `manual_discount_value` int DEFAULT 0;