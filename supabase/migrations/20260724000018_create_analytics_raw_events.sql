-- Migration: Create analytics_raw_events table to support ClickHouse migration
-- Date: 2026-07-24

CREATE TABLE IF NOT EXISTS public.analytics_raw_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for speed and aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_raw_events_shop_type ON public.analytics_raw_events (shop_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_raw_events_timestamp ON public.analytics_raw_events (timestamp);

-- Enable RLS
ALTER TABLE public.analytics_raw_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (visitors sending events) and select
DROP POLICY IF EXISTS "Anyone can insert analytics raw events" ON public.analytics_raw_events;
CREATE POLICY "Anyone can insert analytics raw events"
    ON public.analytics_raw_events
    FOR ALL
    USING (true)
    WITH CHECK (true);
