-- Migration: Optimize query performance with targeted indexes and RPC queue resequencer
-- Date: 2026-07-24

-- 1. Create Index on video_candidates(room_id) for fast WebRTC signaling queries
CREATE INDEX IF NOT EXISTS idx_video_candidates_room_id ON public.video_candidates(room_id);

-- 2. Create composite Index on conversations for chat inbox list ordering
CREATE INDEX IF NOT EXISTS idx_conversations_shop_activity ON public.conversations(shop_id, last_activity_at DESC);

-- 3. Create composite Index on messages for conversation message history retrieves
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);

-- 4. Create Indexes on call_logs for visitor/agent lookups
CREATE INDEX IF NOT EXISTS idx_call_logs_visitor_id ON public.call_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id ON public.call_logs(agent_id);

-- 5. Create composite Index on call_queues for waiting status filters
CREATE INDEX IF NOT EXISTS idx_call_queues_shop_status ON public.call_queues(shop_id, status);

-- 6. Create RPC function to resequence the waiting queue in a single transaction (resolves client N+1 loop)
CREATE OR REPLACE FUNCTION public.resequence_queue(p_shop_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.call_queues cq
    SET 
        position = sub.new_pos,
        estimated_wait = sub.new_pos * 60
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY joined_at ASC) as new_pos
        FROM public.call_queues
        WHERE shop_id = p_shop_id AND status = 'waiting'
    ) sub
    WHERE cq.id = sub.id;
END;
$$;
