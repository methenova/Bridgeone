-- Migration: Create missing base tables and align database schema with frontend queries
-- Date: 2026-07-24

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to categories') THEN
        CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
    END IF;
END $$;

-- Seed default categories
INSERT INTO public.categories (name, slug, icon) VALUES
('Fashion & Apparel', 'fashion_apparel', 'Shirt'),
('Beauty & Cosmetics', 'beauty_cosmetics', 'Sparkles'),
('Luxury & Jewelry', 'luxury_jewelry', 'Gem'),
('Electronics & Tech', 'electronics_tech', 'Smartphone'),
('Home & Living', 'home_living', 'Home'),
('Health & Wellness', 'health_wellness', 'Heart'),
('Food & Beverage', 'food_beverage', 'Coffee'),
('Other Retail', 'other_retail', 'Store')
ON CONFLICT (slug) DO NOTHING;

-- 2. Update Shops Table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Migrate existing categories data
UPDATE public.shops s
SET category_id = (SELECT id FROM public.categories c WHERE c.slug = s.category OR c.slug = 'other_retail')
WHERE s.category_id IS NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='category');

-- Drop old category column
ALTER TABLE public.shops DROP COLUMN IF EXISTS category;

-- Create index on shop category_id
CREATE INDEX IF NOT EXISTS idx_shops_category_id ON public.shops(category_id);

-- 3. Create Visitors Table
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    visitor_key TEXT NOT NULL UNIQUE,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'offline',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Visitors
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts and updates for visitors') THEN
        CREATE POLICY "Allow public inserts and updates for visitors" ON public.visitors FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_visitors_shop_id ON public.visitors(shop_id);

-- 4. Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'chat',
    status TEXT NOT NULL DEFAULT 'waiting',
    subject TEXT,
    started_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts and updates for conversations') THEN
        CREATE POLICY "Allow public inserts and updates for conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_shop_id ON public.conversations(shop_id);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id ON public.conversations(visitor_id);

-- 5. Create Base Messages Table (Safe check if migration 17 ran already)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL,
    sender_shop_member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts and updates for messages') THEN
        CREATE POLICY "Allow public inserts and updates for messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- 6. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    compare_at_price NUMERIC,
    sku TEXT,
    barcode TEXT,
    stock_quantity INT DEFAULT 0,
    track_qty BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active',
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to products') THEN
        CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can manage own products') THEN
        CREATE POLICY "Owners can manage own products" ON public.products FOR ALL USING (
            EXISTS (SELECT 1 FROM public.shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid())
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- 7. Create Video Rooms Table
CREATE TABLE IF NOT EXISTS public.video_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    room_code TEXT NOT NULL UNIQUE,
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Video Rooms
ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access to video rooms') THEN
        CREATE POLICY "Allow public access to video rooms" ON public.video_rooms FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_rooms_shop_id ON public.video_rooms(shop_id);

-- 8. Create Call Logs Table
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    duration INT DEFAULT 0,
    status TEXT DEFAULT 'missed',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Enable RLS for Call Logs
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts and updates for call logs') THEN
        CREATE POLICY "Allow public inserts and updates for call logs" ON public.call_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_call_logs_shop_id ON public.call_logs(shop_id);

-- 9. Create Callback Requests Table
CREATE TABLE IF NOT EXISTS public.callback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Callback Requests
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts and updates for callback requests') THEN
        CREATE POLICY "Allow public inserts and updates for callback requests" ON public.callback_requests FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_callback_requests_shop_id ON public.callback_requests(shop_id);
