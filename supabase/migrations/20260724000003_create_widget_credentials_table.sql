-- ====================================================================
-- Production Database Migration: Production Widget Credentials Table
-- Date: 2026-07-24
-- ====================================================================

-- 1. Create Production Widget Credentials Table
CREATE TABLE IF NOT EXISTS public.widget_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID UNIQUE NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    widget_key TEXT NOT NULL UNIQUE,
    public_api_key TEXT NOT NULL,
    private_api_key TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.widget_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only shop owners can access their widget credentials
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can view own widget credentials') THEN
        CREATE POLICY "Owners can view own widget credentials" 
            ON public.widget_credentials 
            FOR ALL 
            USING (
                EXISTS (
                    SELECT 1 FROM public.shops 
                    WHERE id = widget_credentials.shop_id AND owner_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 3. Indexes for Instant Key Resolution
CREATE INDEX IF NOT EXISTS idx_widget_credentials_shop_id ON public.widget_credentials(shop_id);
CREATE INDEX IF NOT EXISTS idx_widget_credentials_widget_key ON public.widget_credentials(widget_key);
CREATE INDEX IF NOT EXISTS idx_widget_credentials_public_api_key ON public.widget_credentials(public_api_key);
