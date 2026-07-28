-- ====================================================================
-- Production Database Migration: Upgrade Device Tokens Table
-- Date: 2026-07-24
-- ====================================================================

-- 1. Add app_version, os_version, device_model, notification_permission, last_login_at fields to device_tokens table
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS os_version TEXT;
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS device_model TEXT;
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS notification_permission TEXT DEFAULT 'default';
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Performance index on notification permissions
CREATE INDEX IF NOT EXISTS idx_device_tokens_permission ON public.device_tokens(notification_permission);
