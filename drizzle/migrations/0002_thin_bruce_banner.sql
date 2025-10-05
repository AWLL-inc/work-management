CREATE INDEX "projects_is_active_idx" ON "projects" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "work_categories_is_active_display_order_idx" ON "work_categories" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE INDEX "work_logs_user_id_date_idx" ON "work_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "work_logs_project_id_idx" ON "work_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "work_logs_category_id_idx" ON "work_logs" USING btree ("category_id");