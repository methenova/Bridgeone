-- Migration: Add missing performance indexes to prevent slow queries on primary tables
-- Date: 2026-07-27

-- 1. call_logs indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_shop_id ON public.call_logs USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON public.call_logs USING btree (created_at DESC);

-- 2. messages composite index
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at ASC);

-- 3. video_candidates index
CREATE INDEX IF NOT EXISTS idx_video_candidates_room_id ON public.video_candidates USING btree (room_id);

-- 4. video_rooms index
CREATE INDEX IF NOT EXISTS idx_video_rooms_shop_id ON public.video_rooms USING btree (shop_id);

-- 5. visitors index
CREATE INDEX IF NOT EXISTS idx_visitors_shop_id ON public.visitors USING btree (shop_id);
