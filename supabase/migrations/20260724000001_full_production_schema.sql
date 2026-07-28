-- ====================================================================
-- Production Database Migration: Complete BridgeOne Platform Schema
-- Tables: profiles, shops, widget_credentials, subscriptions, device_tokens
-- Date: 2026-07-24
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    phone_number TEXT,
    country TEXT,
    timezone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'owner',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    current_onboarding_step TEXT NOT NULL DEFAULT '1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SHOPS TABLE
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    name TEXT,
    business_email TEXT NOT NULL,
    email TEXT,
    business_phone TEXT NOT NULL,
    phone TEXT,
    website TEXT NOT NULL,
    domain TEXT,
    category TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    gst_number TEXT,
    working_hours TEXT,
    business_hours TEXT,
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    default_language TEXT DEFAULT 'en',
    monthly_visitors TEXT,
    expected_monthly_visitors TEXT,
    number_of_agents TEXT DEFAULT '1-5',
    agent_count TEXT DEFAULT '1-5',
    logo TEXT,
    logo_url TEXT,
    business_logo TEXT,
    widget_key TEXT UNIQUE,
    api_key TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    widget_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WIDGET_CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.widget_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID UNIQUE NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    widget_key TEXT NOT NULL UNIQUE,
    public_api_key TEXT NOT NULL,
    private_api_key TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'starter',
    plan_name TEXT DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'trialing',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DEVICE_TOKENS TABLE (FCM Push Notifications Infrastructure)
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

-- RLS & Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- RLS Policies for Shops
CREATE POLICY "Owners can manage own shops" ON public.shops FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for Widget Credentials
CREATE POLICY "Owners can view own widget credentials" ON public.widget_credentials FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- RLS Policies for Subscriptions
CREATE POLICY "Owners can manage own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Device Tokens
CREATE POLICY "Users can manage own device tokens" ON public.device_tokens FOR ALL USING (auth.uid() = user_id);
