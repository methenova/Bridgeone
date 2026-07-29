-- Migration: Simplify RLS policies on video_rooms and video_candidates for Supabase Realtime compatibility
-- Date: 2026-07-29

-- Drop video_rooms policies
DROP POLICY IF EXISTS "VideoRooms SELECT own or shop member" ON public.video_rooms;
DROP POLICY IF EXISTS "VideoRooms UPDATE own or shop member" ON public.video_rooms;
DROP POLICY IF EXISTS "VideoRooms DELETE owner" ON public.video_rooms;
DROP POLICY IF EXISTS "VideoRooms INSERT authenticated member" ON public.video_rooms;
DROP POLICY IF EXISTS "VideoRooms SELECT admin" ON public.video_rooms;
DROP POLICY IF EXISTS "VideoRooms DELETE admin" ON public.video_rooms;

-- Create simple video_rooms policies
CREATE POLICY "VideoRooms SELECT public" ON public.video_rooms FOR SELECT TO public USING (true);
CREATE POLICY "VideoRooms INSERT public" ON public.video_rooms FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "VideoRooms UPDATE public" ON public.video_rooms FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "VideoRooms DELETE public" ON public.video_rooms FOR DELETE TO public USING (true);

-- Drop video_candidates policies
DROP POLICY IF EXISTS "VideoCandidates SELECT own or shop member" ON public.video_candidates;
DROP POLICY IF EXISTS "VideoCandidates INSERT shop member" ON public.video_candidates;
DROP POLICY IF EXISTS "VideoCandidates INSERT visitor" ON public.video_candidates;

-- Create simple video_candidates policies
CREATE POLICY "VideoCandidates SELECT public" ON public.video_candidates FOR SELECT TO public USING (true);
CREATE POLICY "VideoCandidates INSERT public" ON public.video_candidates FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "VideoCandidates UPDATE public" ON public.video_candidates FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "VideoCandidates DELETE public" ON public.video_candidates FOR DELETE TO public USING (true);
