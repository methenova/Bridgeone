-- Migration: Fix Database Schema and User Profiles
-- Created to align the Supabase database with the codebase expectations

-- 1. Add missing 'role' column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;

-- 2. Create handle_new_user function and trigger for automatic profile replication
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      account_status = EXCLUDED.account_status;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Sync existing users in auth.users to public.profiles
INSERT INTO public.profiles (id, full_name, email, role, account_status)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', 'User') as full_name,
  email,
  COALESCE(raw_user_meta_data->>'role', 'customer') as role,
  'active' as account_status
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    account_status = EXCLUDED.account_status;

-- 4. Align shops columns with frontend application code (rename owner_profile_id and postal_code)
ALTER TABLE public.shops RENAME COLUMN owner_profile_id TO owner_id;
ALTER TABLE public.shops RENAME COLUMN postal_code TO pincode;

-- 5. Create generate_shop_slug function and trigger for automatic slug generation
CREATE OR REPLACE FUNCTION public.generate_shop_slug()
RETURNS trigger AS $$
BEGIN
  IF new.slug IS NULL OR new.slug = '' THEN
    new.slug := LOWER(REGEXP_REPLACE(new.shop_name, '[^a-zA-Z0-9]+', '-', 'g'));
    new.slug := TRIM(BOTH '-' FROM new.slug);
    IF new.slug = '' THEN
      new.slug := 'shop-' || SUBSTR(MD5(RANDOM()::text), 1, 5);
    END IF;
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.shops WHERE slug = new.slug) LOOP
      new.slug := new.slug || '-' || SUBSTR(MD5(RANDOM()::text), 1, 3);
    END LOOP;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_shop_created_generate_slug ON public.shops;

CREATE TRIGGER on_shop_created_generate_slug
  BEFORE INSERT ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.generate_shop_slug();

-- 6. Grant privileges to database roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
