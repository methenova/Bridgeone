-- Migration: Provision missing storage buckets and enforce secure RLS storage policies
-- Date: 2026-07-27

-- 1. Create missing public/private storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('shop-banners', 'shop-banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('profile-photos', 'profile-photos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('chat-attachments', 'chat-attachments', false, 10485760, null),
  ('merchant-documents', 'merchant-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Shop Assets SELECT public" ON storage.objects;
DROP POLICY IF EXISTS "Shop Assets manage members" ON storage.objects;
DROP POLICY IF EXISTS "Product Images SELECT public" ON storage.objects;
DROP POLICY IF EXISTS "Product Images manage members" ON storage.objects;
DROP POLICY IF EXISTS "Profile Photos SELECT public" ON storage.objects;
DROP POLICY IF EXISTS "Profile Photos manage owner" ON storage.objects;
DROP POLICY IF EXISTS "Chat Attachments SELECT participants" ON storage.objects;
DROP POLICY IF EXISTS "Chat Attachments INSERT participants" ON storage.objects;
DROP POLICY IF EXISTS "Merchant Documents SELECT authorized" ON storage.objects;
DROP POLICY IF EXISTS "Merchant Documents manage owner" ON storage.objects;

-- 3. Define production-ready storage policies

-- shop-logos & shop-banners
CREATE POLICY "Shop Assets SELECT public" ON storage.objects
  FOR SELECT USING (bucket_id IN ('shop-logos', 'shop-banners'));

CREATE POLICY "Shop Assets manage members" ON storage.objects
  FOR ALL USING (
    bucket_id IN ('shop-logos', 'shop-banners')
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM public.shops 
        WHERE shops.id::text = (storage.foldername(name))[1] 
        AND shops.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.shop_members 
        JOIN public.shops ON shops.id = shop_members.shop_id
        WHERE shops.id::text = (storage.foldername(name))[1] 
        AND shop_members.profile_id = auth.uid()
      )
    )
  );

-- product-images
CREATE POLICY "Product Images SELECT public" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Product Images manage members" ON storage.objects
  FOR ALL USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM public.shops 
        WHERE shops.id::text = (storage.foldername(name))[1] 
        AND shops.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.shop_members 
        JOIN public.shops ON shops.id = shop_members.shop_id
        WHERE shops.id::text = (storage.foldername(name))[1] 
        AND shop_members.profile_id = auth.uid()
      )
    )
  );

-- profile-photos
CREATE POLICY "Profile Photos SELECT public" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Profile Photos manage owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'profile-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- chat-attachments
CREATE POLICY "Chat Attachments SELECT participants" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.conversations c 
        JOIN public.shops s ON s.id = c.shop_id 
        WHERE c.id::text = (storage.foldername(name))[1] 
        AND (
          s.owner_id = auth.uid() 
          OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid())
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.conversations c 
        JOIN public.visitors v ON v.id = c.visitor_id 
        WHERE c.id::text = (storage.foldername(name))[1] 
        AND v.email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "Chat Attachments INSERT participants" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.conversations c 
        JOIN public.shops s ON s.id = c.shop_id 
        WHERE c.id::text = (storage.foldername(name))[1] 
        AND (
          s.owner_id = auth.uid() 
          OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid())
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.conversations c 
        JOIN public.visitors v ON v.id = c.visitor_id 
        WHERE c.id::text = (storage.foldername(name))[1] 
        AND v.email = auth.jwt()->>'email'
      )
    )
  );

-- merchant-documents
CREATE POLICY "Merchant Documents SELECT authorized" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'merchant-documents'
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM public.shops 
        WHERE shops.id::text = (storage.foldername(name))[1] 
        AND shops.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Merchant Documents manage owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'merchant-documents'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.shops 
      WHERE shops.id::text = (storage.foldername(name))[1] 
      AND shops.owner_id = auth.uid()
    )
  );
