ALTER TABLE "users" ADD COLUMN "password_reset_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_password_change" timestamp;