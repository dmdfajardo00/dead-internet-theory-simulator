CREATE TABLE `bookmarks` (
	`visitor_id` text NOT NULL,
	`post_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`visitor_id`, `post_id`),
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bookmarks_visitor_idx` ON `bookmarks` (`visitor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `debate_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`root_post_id` text NOT NULL,
	`target_post_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`kind` text NOT NULL,
	`persona_id` text,
	`persona_order` text,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`root_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `debate_runs_root_idx` ON `debate_runs` (`root_post_id`);--> statement-breakpoint
CREATE INDEX `debate_runs_visitor_idx` ON `debate_runs` (`visitor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `debate_runs_created_idx` ON `debate_runs` (`created_at`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_type` text NOT NULL,
	`author_id` text NOT NULL,
	`parent_id` text,
	`root_id` text NOT NULL,
	`content` text NOT NULL,
	`media` text,
	`topic` text,
	`generator` text,
	`debate_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_feed_idx` ON `posts` (`parent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `posts_root_idx` ON `posts` (`root_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `posts_author_idx` ON `posts` (`author_type`,`author_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `posts_topic_idx` ON `posts` (`topic`);--> statement-breakpoint
CREATE TABLE `reactions` (
	`visitor_id` text NOT NULL,
	`post_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`visitor_id`, `post_id`),
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reactions_post_idx` ON `reactions` (`post_id`);--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`kind` text DEFAULT 'guest' NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visitors_token_hash_unique` ON `visitors` (`token_hash`);