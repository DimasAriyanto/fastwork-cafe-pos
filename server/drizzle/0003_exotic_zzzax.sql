CREATE TABLE `menu_toppings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menu_id` int NOT NULL,
	`topping_id` int NOT NULL,
	CONSTRAINT `menu_toppings_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_menu_topping` UNIQUE(`menu_id`,`topping_id`)
);
--> statement-breakpoint
ALTER TABLE `menu_toppings` ADD CONSTRAINT `menu_toppings_menu_id_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_toppings` ADD CONSTRAINT `menu_toppings_topping_id_toppings_id_fk` FOREIGN KEY (`topping_id`) REFERENCES `toppings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_menu_toppings_menu` ON `menu_toppings` (`menu_id`);--> statement-breakpoint
CREATE INDEX `idx_menu_toppings_topping` ON `menu_toppings` (`topping_id`);