-- Migration: Add missing columns and support duration_seconds on public.call_logs
-- Date: 2026-07-24

ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS transferred_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS products_shared TEXT[] DEFAULT '{}';
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS csat_score INT;
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS resolution_status TEXT;
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS revenue_generated NUMERIC DEFAULT 0;
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;

-- Trigger function to automatically keep duration and duration_seconds in sync
CREATE OR REPLACE FUNCTION public.sync_call_logs_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync duration to duration_seconds if duration changes
    IF TG_OP = 'INSERT' THEN
        IF NEW.duration_seconds = 0 AND NEW.duration > 0 THEN
            NEW.duration_seconds := NEW.duration;
        ELSIF NEW.duration = 0 AND NEW.duration_seconds > 0 THEN
            NEW.duration := NEW.duration_seconds;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.duration IS DISTINCT FROM OLD.duration THEN
            NEW.duration_seconds := NEW.duration;
        ELSIF NEW.duration_seconds IS DISTINCT FROM OLD.duration_seconds THEN
            NEW.duration := NEW.duration_seconds;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_call_logs_duration ON public.call_logs;
CREATE TRIGGER trg_sync_call_logs_duration
    BEFORE INSERT OR UPDATE ON public.call_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_call_logs_duration();
