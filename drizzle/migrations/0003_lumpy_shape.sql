-- Search performance indexes for work_logs table
-- These indexes will significantly improve search performance for common queries

CREATE INDEX CONCURRENTLY IF NOT EXISTS "work_logs_date_user_idx" ON "work_logs" USING btree ("date" DESC NULLS LAST,"user_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "work_logs_project_category_idx" ON "work_logs" USING btree ("project_id","category_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "work_logs_details_gin_idx" ON "work_logs" USING gin (to_tsvector('simple', "details"));--> statement-breakpoint

-- Update table statistics for query planner optimization
ANALYZE work_logs;