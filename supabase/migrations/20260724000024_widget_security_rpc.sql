-- Migration: Create public.validate_widget_key RPC function for secure API key and domain validation
-- Date: 2026-07-24

CREATE OR REPLACE FUNCTION public.validate_widget_key(
    p_shop_id UUID,
    p_widget_key TEXT,
    p_domain TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_website TEXT;
    v_widget_enabled BOOLEAN;
    v_primary_color TEXT := '#2563eb';
    v_widget_position TEXT := 'bottom-right';
    v_clean_domain TEXT;
BEGIN
    -- 1. Get Shop Details
    SELECT website, widget_enabled
    INTO v_website, v_widget_enabled
    FROM public.shops
    WHERE id = p_shop_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Shop not found');
    END IF;

    IF v_widget_enabled = FALSE THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Widget is disabled for this shop');
    END IF;

    -- 2. Verify Widget Credentials
    IF NOT EXISTS (
        SELECT 1 
        FROM public.widget_credentials 
        WHERE shop_id = p_shop_id 
          AND key_id = p_widget_key 
          AND is_revoked = FALSE 
          AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid or expired widget credentials');
    END IF;

    -- 3. Validate Domain (if shop website is configured)
    -- Normalize domain: remove protocol and port if present
    v_clean_domain := LOWER(p_domain);
    v_clean_domain := regexp_replace(v_clean_domain, '^https?://', '');
    v_clean_domain := split_part(v_clean_domain, ':', 1);

    IF v_website IS NOT NULL AND v_website <> '' THEN
        DECLARE
            v_clean_website TEXT;
        BEGIN
            v_clean_website := LOWER(v_website);
            v_clean_website := regexp_replace(v_clean_website, '^https?://', '');
            v_clean_website := split_part(v_clean_website, ':', 1);

            -- Allow exact match, subdomains, and local dev environments (localhost, 127.0.0.1)
            IF v_clean_domain <> v_clean_website 
               AND v_clean_domain NOT LIKE '%.' || v_clean_website 
               AND v_clean_domain <> 'localhost' 
               AND v_clean_domain <> '127.0.0.1' THEN
                RETURN jsonb_build_object('valid', FALSE, 'error', 'Domain mismatch: ' || v_clean_domain || ' is not permitted for this widget');
            END IF;
        END;
    END IF;

    -- 4. Get Widget Settings
    SELECT primary_color, widget_position
    INTO v_primary_color, v_widget_position
    FROM public.widget_settings
    WHERE shop_id = p_shop_id
    LIMIT 1;

    RETURN jsonb_build_object(
        'valid', TRUE,
        'primary_color', COALESCE(v_primary_color, '#2563eb'),
        'widget_position', COALESCE(v_widget_position, 'bottom-right')
    );
END;
$$;
