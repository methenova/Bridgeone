-- ====================================================================
-- Production Database Migration: Refactor Shops & Organizations Schema
-- Date: 2026-07-24
-- ====================================================================

-- 1. Make business columns in shops table nullable to allow moving them to organizations
ALTER TABLE public.shops ALTER COLUMN business_name DROP NOT NULL;
ALTER TABLE public.shops ALTER COLUMN business_email DROP NOT NULL;
ALTER TABLE public.shops ALTER COLUMN business_phone DROP NOT NULL;

-- 2. Ensure organizations table has all necessary fields with appropriate types
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
