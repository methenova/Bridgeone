-- Migration: Upgrade notification_logs table to support FCM device parameters and retry logs
-- Date: 2026-07-24

ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS device_token TEXT;
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS notification_type TEXT;
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
