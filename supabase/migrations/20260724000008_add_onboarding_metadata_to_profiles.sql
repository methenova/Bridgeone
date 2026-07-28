-- ====================================================================
-- Production Database Migration: Add Onboarding Metadata Column to Profiles
-- Date: 2026-07-24
-- ====================================================================

-- 1. Add onboarding_metadata JSONB column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_metadata JSONB DEFAULT '{}'::jsonb;
