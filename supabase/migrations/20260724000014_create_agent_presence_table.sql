-- Migration: Create agent_presence table to track real-time agent availability
-- Created at: 2026-07-24

CREATE TABLE IF NOT EXISTS public.agent_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'away', 'busy', 'on_call', 'break')),
    last_seen TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now(),
    device_type TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for quick lookups on presence by shop and user
CREATE INDEX IF NOT EXISTS idx_agent_presence_shop_status ON public.agent_presence (shop_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_presence_user_shop ON public.agent_presence (user_id, shop_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.agent_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own presence" ON public.agent_presence;
CREATE POLICY "Users can manage their own presence"
    ON public.agent_presence
    FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view presence records" ON public.agent_presence;
CREATE POLICY "Anyone can view presence records"
    ON public.agent_presence
    FOR SELECT
    USING (true);
