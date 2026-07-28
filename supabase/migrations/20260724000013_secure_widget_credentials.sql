-- ====================================================================
-- Production Database Migration: Secure Widget Credentials
-- Date: 2026-07-24
-- ====================================================================

-- 1. Drop existing public.widget_credentials table to refactor securely
DROP TABLE IF EXISTS public.widget_credentials;

-- 2. Create Upgraded Secure Widget Credentials Table
CREATE TABLE public.widget_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    key_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    private_secret_hash TEXT NOT NULL,
    webhook_secret_hash TEXT NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.widget_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only shop owners can view or manage their widget credentials metadata (secrets are never stored raw anyway)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can view own secure credentials') THEN
        CREATE POLICY "Owners can view own secure credentials" 
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

-- 4. Audit Log Query Indexes
CREATE INDEX IF NOT EXISTS idx_widget_credentials_key_id ON public.widget_credentials(key_id);
CREATE INDEX IF NOT EXISTS idx_widget_credentials_shop_id ON public.widget_credentials(shop_id);
CREATE INDEX IF NOT EXISTS idx_widget_credentials_revoked ON public.widget_credentials(is_revoked);
