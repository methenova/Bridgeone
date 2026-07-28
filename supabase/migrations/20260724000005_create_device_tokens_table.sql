-- ====================================================================
-- Production Database Migration: FCM Device Tokens Table
-- Date: 2026-07-24
-- ====================================================================

-- 1. Create Production Device Tokens Table
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL DEFAULT 'web',
    device_name TEXT DEFAULT 'Web Browser',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own device tokens
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own device tokens') THEN
        CREATE POLICY "Users can manage own device tokens" 
            ON public.device_tokens 
            FOR ALL 
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Automatic Updated At Timestamp Trigger
DROP TRIGGER IF EXISTS set_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER set_device_tokens_updated_at
    BEFORE UPDATE ON public.device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Foreign Key & Device Resolution Indexes (Supports Multiple Devices Per User)
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_device_token ON public.device_tokens(device_token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_is_active ON public.device_tokens(is_active);
