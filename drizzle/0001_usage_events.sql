CREATE TABLE `usage_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`visitor_id` text NOT NULL,
	`ip` text NOT NULL,
	`root_id` text,
	`run_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `usage_visitor_idx` ON `usage_events` (`kind`,`visitor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `usage_ip_idx` ON `usage_events` (`kind`,`ip`,`created_at`);--> statement-breakpoint
CREATE INDEX `usage_created_idx` ON `usage_events` (`kind`,`created_at`);--> statement-breakpoint
CREATE INDEX `usage_root_idx` ON `usage_events` (`root_id`);--> statement-breakpoint
CREATE INDEX `usage_run_idx` ON `usage_events` (`run_id`);