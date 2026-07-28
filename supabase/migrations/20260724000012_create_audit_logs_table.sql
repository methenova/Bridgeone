-- ====================================================================
-- Production Database Migration: Production Audit Logs Table
-- Date: 2026-07-24
-- ====================================================================

-- 1. Create Production Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'login', 'logout', 'register', 'profile_update', 'business_update', 'widget_generation', 'api_key_generation', 'subscription_change', 'password_change', 'role_change'
    resource TEXT NOT NULL, -- 'auth', 'profile', 'business', 'widget', 'subscription'
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own audit logs') THEN
        CREATE POLICY "Users can view own audit logs" 
            ON public.audit_logs 
            FOR SELECT 
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Audit Log Query Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
