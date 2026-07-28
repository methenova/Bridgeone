-- Migration: Create call_queues table to manage visitor call waiting queues
-- Created at: 2026-07-24

CREATE TABLE IF NOT EXISTS public.call_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    call_type TEXT NOT NULL DEFAULT 'video',
    priority INT NOT NULL DEFAULT 1,
    position INT NOT NULL DEFAULT 1,
    estimated_wait INT NOT NULL DEFAULT 60,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'answered', 'abandoned', 'timeout')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for quick queue status lookups and sorting
CREATE INDEX IF NOT EXISTS idx_call_queues_shop_status ON public.call_queues (shop_id, status);
CREATE INDEX IF NOT EXISTS idx_call_queues_joined_at ON public.call_queues (joined_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.call_queues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can manage their own queue records" ON public.call_queues;
CREATE POLICY "Anyone can manage their own queue records"
    ON public.call_queues
    FOR ALL
    USING (true)
    WITH CHECK (true);
