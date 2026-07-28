-- Migration: Create handle_failed_login RPC function running as SECURITY DEFINER
-- Date: 2026-07-24

CREATE OR REPLACE FUNCTION public.handle_failed_login(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id UUID;
    v_attempts INT;
    v_lock_time TIMESTAMPTZ;
BEGIN
    -- Find active profile by lowercased, trimmed email
    SELECT id, COALESCE(failed_login_attempts, 0)
    INTO v_profile_id, v_attempts
    FROM public.profiles
    WHERE email = LOWER(TRIM(user_email)) AND status = 'active';

    IF v_profile_id IS NOT NULL THEN
        v_attempts := v_attempts + 1;
        
        IF v_attempts >= 5 THEN
            -- Lock account for 15 minutes
            v_lock_time := now() + interval '15 minutes';
            UPDATE public.profiles
            SET failed_login_attempts = v_attempts,
                locked_until = v_lock_time,
                updated_at = now()
            WHERE id = v_profile_id;
        ELSE
            UPDATE public.profiles
            SET failed_login_attempts = v_attempts,
                updated_at = now()
            WHERE id = v_profile_id;
        END IF;
    END IF;
END;
$$;
