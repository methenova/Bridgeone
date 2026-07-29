-- Migration: Upgrade public.validate_widget_key RPC function for secure and flexible domain validation
-- Date: 2026-07-29

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
    v_shopify_domain TEXT;
    v_widget_enabled BOOLEAN;
    v_primary_color TEXT := '#2563eb';
    v_widget_position TEXT := 'bottom-right';
    v_clean_domain TEXT;
BEGIN
    -- 1. Get Shop Details
    SELECT website, shopify_domain, widget_enabled
    INTO v_website, v_shopify_domain, v_widget_enabled
    FROM public.shops
    WHERE id = p_shop_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Shop not found');
    END IF;

    IF v_widget_enabled = FALSE THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Widget is disabled for this shop');
    END IF;

    -- 2. Verify Widget Credentials (fallback to matching shops.widget_key if no credentials exist)
    IF NOT EXISTS (
        SELECT 1 
        FROM public.widget_credentials 
        WHERE shop_id = p_shop_id 
          AND key_id = p_widget_key 
          AND is_revoked = FALSE 
          AND (expires_at IS NULL OR expires_at > NOW())
    ) AND NOT EXISTS (
        SELECT 1
        FROM public.shops
        WHERE id = p_shop_id
          AND widget_key = p_widget_key
    ) THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid or expired widget credentials');
    END IF;

    -- 3. Validate Domain (if website or shopify_domain is configured)
    -- Normalize domain: remove protocol and port if present
    v_clean_domain := LOWER(p_domain);
    v_clean_domain := regexp_replace(v_clean_domain, '^https?://', '');
    v_clean_domain := split_part(v_clean_domain, ':', 1);

    DECLARE
        v_clean_website TEXT := '';
        v_clean_shopify TEXT := '';
        v_domain_matches BOOLEAN := FALSE;
    BEGIN
        -- Get website domain
        IF v_website IS NOT NULL AND v_website <> '' THEN
            v_clean_website := LOWER(v_website);
            v_clean_website := regexp_replace(v_clean_website, '^https?://', '');
            v_clean_website := split_part(v_clean_website, ':', 1);
        END IF;

        -- Get shopify domain
        IF v_shopify_domain IS NOT NULL AND v_shopify_domain <> '' THEN
            v_clean_shopify := LOWER(v_shopify_domain);
            v_clean_shopify := regexp_replace(v_clean_shopify, '^https?://', '');
            v_clean_shopify := split_part(v_clean_shopify, ':', 1);
        END IF;

        -- Check match
        IF v_clean_domain = 'localhost' OR v_clean_domain = '127.0.0.1' OR v_clean_domain = '' THEN
            v_domain_matches := TRUE;
        ELSIF v_clean_shopify = '*' THEN
            v_domain_matches := TRUE; -- Wildcard shopify domain bypasses restriction
        ELSIF v_clean_website <> '' AND (v_clean_domain = v_clean_website OR v_clean_domain LIKE '%.' || v_clean_website) THEN
            v_domain_matches := TRUE;
        ELSIF v_clean_shopify <> '' AND (v_clean_domain = v_clean_shopify OR v_clean_domain LIKE '%.' || v_clean_shopify) THEN
            v_domain_matches := TRUE;
        ELSIF v_clean_website = '' AND v_clean_shopify = '' THEN
            v_domain_matches := TRUE; -- No domain restriction configured
        END IF;

        IF NOT v_domain_matches THEN
            RETURN jsonb_build_object('valid', FALSE, 'error', 'Domain mismatch: ' || v_clean_domain || ' is not permitted for this widget');
        END IF;
    END;

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
