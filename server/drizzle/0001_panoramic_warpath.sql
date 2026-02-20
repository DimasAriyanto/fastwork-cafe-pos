ALTER TABLE `discounts` ADD `code` varchar(50);--> statement-breakpoint
ALTER TABLE `discounts` ADD `min_spend` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `discounts` ADD CONSTRAINT `discounts_code_unique` UNIQUE(`code`);