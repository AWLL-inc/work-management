CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "work_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "work_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"hours" varchar(10) NOT NULL,
	"project_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_category_id_work_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."work_categories"("id") ON DELETE restrict ON UPDATE no action;