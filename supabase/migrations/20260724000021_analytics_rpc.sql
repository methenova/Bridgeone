-- Migration: Create PostgreSQL view and RPC for server-side analytics aggregation
-- Date: 2026-07-24

-- 1. Create Summary View
CREATE OR REPLACE VIEW public.analytics_events_summary AS
SELECT 
    shop_id,
    COUNT(CASE WHEN event_type = 'widget_loaded' THEN 1 END) AS widget_loads,
    COUNT(CASE WHEN event_type = 'widget_opened' THEN 1 END) AS widget_opens,
    COUNT(CASE WHEN event_type = 'video_call_started' THEN 1 END) AS calls_started,
    COUNT(CASE WHEN event_type = 'video_call_answered' THEN 1 END) AS calls_answered,
    COUNT(CASE WHEN event_type = 'video_call_missed' THEN 1 END) AS calls_missed,
    COUNT(CASE WHEN event_type = 'message_sent' THEN 1 END) AS messages_count,
    COUNT(CASE WHEN event_type = 'product_viewed' THEN 1 END) AS products_viewed_count
FROM public.analytics_raw_events
GROUP BY shop_id;

-- 2. Create RPC function for full dashboard aggregations
CREATE OR REPLACE FUNCTION public.get_dashboard_aggregates(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_widget_loads INT := 0;
    v_widget_opens INT := 0;
    v_calls_started INT := 0;
    v_calls_answered INT := 0;
    v_calls_missed INT := 0;
    v_total_duration NUMERIC := 0;
    v_total_queue_time NUMERIC := 0;
    v_queue_count INT := 0;
    v_total_response_time NUMERIC := 0;
    v_response_count INT := 0;
    v_messages_count INT := 0;
    v_products_viewed INT := 0;
    v_bounce_rate INT := 0;
    v_avg_duration INT := 0;
    v_avg_queue INT := 0;
    v_avg_response INT := 0;
BEGIN
    -- Enforce RLS validation (only owner of the shop can query analytics)
    IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id AND (owner_id = auth.uid() OR auth.uid() IS NULL)) THEN
        RETURN jsonb_build_object('error', 'Unauthorized access to shop analytics');
    END IF;

    -- Aggregate event counts and sums from analytics_raw_events
    SELECT 
        COALESCE(COUNT(CASE WHEN event_type = 'widget_loaded' THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'widget_opened' THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'video_call_started' THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'video_call_answered' THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'video_call_missed' THEN 1 END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'call_duration' THEN (event_data->>'duration')::NUMERIC END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'queue_time' THEN (event_data->>'seconds')::NUMERIC END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'queue_time' AND event_data->>'seconds' IS NOT NULL THEN 1 END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'agent_response_time' THEN (event_data->>'seconds')::NUMERIC END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'agent_response_time' AND event_data->>'seconds' IS NOT NULL THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'message_sent' THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN event_type = 'product_viewed' THEN 1 END), 0)
    INTO
        v_widget_loads,
        v_widget_opens,
        v_calls_started,
        v_calls_answered,
        v_calls_missed,
        v_total_duration,
        v_total_queue_time,
        v_queue_count,
        v_total_response_time,
        v_response_count,
        v_messages_count,
        v_products_viewed
    FROM public.analytics_raw_events
    WHERE shop_id = p_shop_id;

    -- Calculate bounce rate and averages
    IF v_widget_loads > 0 THEN
        v_bounce_rate := ROUND(((v_widget_loads - v_widget_opens)::NUMERIC / v_widget_loads::NUMERIC) * 100);
    END IF;

    IF v_calls_answered > 0 THEN
        v_avg_duration := ROUND(v_total_duration / v_calls_answered);
    END IF;

    IF v_queue_count > 0 THEN
        v_avg_queue := ROUND(v_total_queue_time / v_queue_count);
    END IF;

    IF v_response_count > 0 THEN
        v_avg_response := ROUND(v_total_response_time / v_response_count);
    END IF;

    -- Return identical schema JSON
    RETURN jsonb_build_object(
        'widgetLoads', v_widget_loads,
        'widgetOpens', v_widget_opens,
        'bounceRate', GREATEST(0, v_bounce_rate),
        'callsStarted', v_calls_started,
        'callsAnswered', v_calls_answered,
        'callsMissed', v_calls_missed,
        'avgCallDuration', v_avg_duration,
        'avgQueueTime', v_avg_queue,
        'avgAgentResponseTime', v_avg_response,
        'messagesCount', v_messages_count,
        'productsViewedCount', v_products_viewed
    );
END;
$$;
