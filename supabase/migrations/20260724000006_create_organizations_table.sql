-- ====================================================================
-- Production Database Migration: Production Organizations Table
-- Supporting Multi-Shop Businesses & Organization Architecture
-- Date: 2026-07-24
-- ====================================================================

-- 1. Create Production Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    business_email TEXT NOT NULL,
    business_phone TEXT,
    country TEXT,
    gst_number TEXT,
    logo TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add organization_id column to public.shops (Optional Foreign Key for backward compatibility)
ALTER TABLE public.shops 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3. Enable Row Level Security (RLS) on Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owners can manage their own organization
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can manage own organization') THEN
        CREATE POLICY "Owners can manage own organization" 
            ON public.organizations 
            FOR ALL 
            USING (auth.uid() = owner_id);
    END IF;
END $$;

-- 4. Automatic Updated At Timestamp Trigger
DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Foreign Key & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_shops_organization_id ON public.shops(organization_id);

-- ====================================================================
-- Data Migration: Automatically Create Default Organizations for Existing Shops & Users
-- ====================================================================

-- Step A: Insert a Default Organization for every existing owner in shops table who doesn't have one yet
INSERT INTO public.organizations (owner_id, organization_name, business_email, business_phone, country, gst_number, logo, status, created_at, updated_at)
SELECT DISTINCT ON (s.owner_id)
    s.owner_id,
    COALESCE(s.business_name, s.shop_name, 'Default Organization') AS organization_name,
    COALESCE(s.business_email, p.email) AS business_email,
    COALESCE(s.business_phone, s.phone, p.phone) AS business_phone,
    COALESCE(s.country, p.country) AS country,
    s.gst_number,
    COALESCE(s.logo, s.logo_url) AS logo,
    'active' AS status,
    NOW(),
    NOW()
FROM public.shops s
JOIN public.profiles p ON p.id = s.owner_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.organizations o WHERE o.owner_id = s.owner_id
);

-- Step B: Auto-link existing shops to their owner's Organization ID
UPDATE public.shops s
SET organization_id = o.id
FROM public.organizations o
WHERE s.owner_id = o.owner_id
  AND s.organization_id IS NULL;
