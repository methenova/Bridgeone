-- Migration: Drop broken call_logs sync trigger
-- Date: 2026-07-29

DROP TRIGGER IF EXISTS trg_sync_call_logs_duration ON public.call_logs;
DROP FUNCTION IF EXISTS public.sync_call_logs_duration();
