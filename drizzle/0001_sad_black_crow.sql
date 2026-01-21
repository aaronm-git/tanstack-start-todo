CREATE TYPE "public"."entity_type" AS ENUM('todo', 'subtask', 'list', 'ai-todo');--> statement-breakpoint
CREATE TYPE "public"."operation_status" AS ENUM('pending', 'success', 'error');--> statement-breakpoint
CREATE TYPE "public"."operation_type" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_type" "operation_type" NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" text,
	"entity_name" text NOT NULL,
	"status" "operation_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"sentry_event_id" text,
	"retry_count" text DEFAULT '0' NOT NULL,
	"max_retries" text DEFAULT '3' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"user_id" text
);
