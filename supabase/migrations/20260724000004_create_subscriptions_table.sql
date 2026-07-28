-- ====================================================================
-- Production Database Migration: Production Subscriptions Table
-- Date: 2026-07-24
-- ====================================================================

-- 1. Create Production Subscriptions Table with Razorpay Support
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'starter',
    plan_name TEXT DEFAULT 'starter', -- Backward compatibility alias
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    status TEXT NOT NULL DEFAULT 'trialing',
    trial_end TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    
    -- Future Razorpay Integration Infrastructure
    razorpay_customer_id TEXT,
    razorpay_subscription_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owners can view and manage their subscription
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can manage own subscriptions') THEN
        CREATE POLICY "Owners can manage own subscriptions" 
            ON public.subscriptions 
            FOR ALL 
            USING (
                auth.uid() = user_id OR auth.uid() = owner_id OR
                EXISTS (SELECT 1 FROM public.shops WHERE id = subscriptions.shop_id AND owner_id = auth.uid())
            );
    END IF;
END $$;

-- 3. Automatic Updated At Timestamp Trigger
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Foreign Key & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON public.subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub_id ON public.subscriptions(razorpay_subscription_id);
