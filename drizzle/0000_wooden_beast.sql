CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"event_type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"location" text NOT NULL,
	"venue" text,
	"category" text NOT NULL,
	"requirements" jsonb NOT NULL,
	"additional_details" jsonb NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
