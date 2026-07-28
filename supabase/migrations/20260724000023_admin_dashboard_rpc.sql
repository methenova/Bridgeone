-- Migration: Create public.get_admin_dashboard_stats RPC function for optimized platform-wide metrics aggregation
-- Date: 2026-07-24

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_orgs INT := 0;
    v_active_orgs INT := 0;
    v_suspended_orgs INT := 0;
    v_active_widgets INT := 0;
    v_active_subs INT := 0;
    v_total_admins INT := 0;
    v_total_agents INT := 0;
    v_live_calls INT := 0;
    v_calls_today INT := 0;
    v_monthly_calls INT := 0;
    v_recent_calls JSONB := '[]'::JSONB;
    v_recent_registrations JSONB := '[]'::JSONB;
    v_today TIMESTAMPTZ := date_trunc('day', now());
    v_first_day_of_month TIMESTAMPTZ := date_trunc('month', now());
BEGIN
    -- Enforce Admin only access
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) THEN
        RETURN jsonb_build_object('error', 'Unauthorized access to platform statistics');
    END IF;

    -- Count Shops/Orgs
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN is_verified = TRUE THEN 1 END),
        COUNT(CASE WHEN is_verified = FALSE THEN 1 END),
        COUNT(CASE WHEN widget_enabled = TRUE THEN 1 END)
    INTO
        v_total_orgs,
        v_active_orgs,
        v_suspended_orgs,
        v_active_widgets
    FROM public.shops;

    -- Count Active Subs
    SELECT COUNT(DISTINCT shop_id)
    INTO v_active_subs
    FROM public.subscriptions
    WHERE plan IN ('basic', 'pro');

    -- Count Profiles
    SELECT
        COUNT(CASE WHEN role = 'seller' THEN 1 END),
        COUNT(CASE WHEN role IN ('agent', 'manager') THEN 1 END)
    INTO
        v_total_admins,
        v_total_agents
    FROM public.profiles;

    -- Count Video Rooms / Calls
    SELECT COUNT(*)
    INTO v_live_calls
    FROM public.video_rooms
    WHERE status = 'connected';

    SELECT COUNT(*)
    INTO v_calls_today
    FROM public.call_logs
    WHERE created_at >= v_today;

    SELECT COUNT(*)
    INTO v_monthly_calls
    FROM public.call_logs
    WHERE created_at >= v_first_day_of_month;

    -- Get Recent Calls (last 5)
    SELECT COALESCE(JSONB_AGG(sub), '[]'::JSONB)
    INTO v_recent_calls
    FROM (
        SELECT cl.*, s.shop_name
        FROM public.call_logs cl
        LEFT JOIN public.shops s ON cl.shop_id = s.id
        ORDER BY cl.created_at DESC
        LIMIT 5
    ) sub;

    -- Get Recent Registrations (last 5)
    SELECT COALESCE(JSONB_AGG(sub), '[]'::JSONB)
    INTO v_recent_registrations
    FROM (
        SELECT id, shop_name, created_at, is_verified
        FROM public.shops
        ORDER BY created_at DESC
        LIMIT 5
    ) sub;

    -- Return JSON
    RETURN jsonb_build_object(
        'totalOrgs', v_total_orgs,
        'activeOrgs', v_active_orgs,
        'suspendedOrgs', v_suspended_orgs,
        'activeWidgets', v_active_widgets,
        'activeSubs', v_active_subs,
        'totalAdmins', v_total_admins,
        'totalAgents', v_total_agents,
        'liveCalls', v_live_calls,
        'callsToday', v_calls_today,
        'monthlyCalls', v_monthly_calls,
        'recentCalls', v_recent_calls,
        'recentRegistrations', v_recent_registrations
    );
END;
$$;
