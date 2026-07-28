-- ====================================================================
-- Production Database Migration: Production Shops Table
-- Date: 2026-07-24
-- ====================================================================

-- 1. Create Production Shops Table
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    name TEXT, -- Backward compatibility alias
    business_email TEXT NOT NULL,
    email TEXT, -- Backward compatibility alias
    business_phone TEXT NOT NULL,
    phone TEXT, -- Backward compatibility alias
    website TEXT NOT NULL,
    domain TEXT, -- Domain alias
    category TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    gst_number TEXT,
    working_hours TEXT,
    business_hours TEXT, -- Backward compatibility alias
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    default_language TEXT DEFAULT 'en', -- Backward compatibility alias
    expected_visitors TEXT,
    monthly_visitors TEXT, -- Backward compatibility alias
    expected_monthly_visitors TEXT, -- Backward compatibility alias
    number_of_agents TEXT DEFAULT '1-5',
    agent_count TEXT DEFAULT '1-5', -- Backward compatibility alias
    logo TEXT,
    logo_url TEXT, -- Backward compatibility alias
    business_logo TEXT, -- Backward compatibility alias
    widget_key TEXT UNIQUE,
    api_key TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    widget_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Shops
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can manage own shops') THEN
        CREATE POLICY "Owners can manage own shops" ON public.shops FOR ALL USING (auth.uid() = owner_id);
    END IF;
END $$;

-- 3. Automatic Updated At Timestamp Trigger
DROP TRIGGER IF EXISTS set_shops_updated_at ON public.shops;
CREATE TRIGGER set_shops_updated_at
    BEFORE UPDATE ON public.shops
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Foreign Key & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_website ON public.shops(website);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_widget_key ON public.shops(widget_key);
