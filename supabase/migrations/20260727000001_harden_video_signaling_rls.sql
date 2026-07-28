-- Migration: Harden video signaling table INSERT policies
-- Date: 2026-07-27
-- Fixes: SEC-1 (ICE candidate injection), SEC-2 (spoofed room creation)
--
-- The previous migration (20260724000026) set both video_rooms and
-- video_candidates INSERT policies to WITH CHECK (true), allowing any
-- client to insert rows into either table without ownership validation.
-- This migration replaces those policies with ownership-aware checks.
--
-- NOTE ON GUEST (UNAUTHENTICATED) CALLERS
-- Guest-gateway is the only permitted entry point for unauthenticated
-- video room creation and candidate insertion. The Edge Function validates
-- the shopId + apiKey pair and uses the service-role key to bypass RLS.
-- Direct anon-key INSERT to these tables is therefore correctly blocked
-- by these policies.

-- ─────────────────────────────────────────────────────────────────────
-- SEC-2 FIX: video_rooms INSERT
-- Previous: WITH CHECK (true) — any user could create a room for any shop.
-- Fixed:    Only authenticated shop owners or members may insert.
--           Unauthenticated (widget) creates must go through guest-gateway.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "VideoRooms INSERT public" ON public.video_rooms;

CREATE POLICY "VideoRooms INSERT authenticated member" ON public.video_rooms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shops s
            WHERE s.id = video_rooms.shop_id
            AND (
                s.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.shop_members m
                    WHERE m.shop_id = s.id
                    AND m.profile_id = auth.uid()
                )
            )
        )
    );

-- ─────────────────────────────────────────────────────────────────────
-- SEC-1 FIX: video_candidates INSERT
-- Previous: WITH CHECK (true) — any client could inject ICE candidates
--           into any room_id (including rooms they don't own).
-- Fixed:    Separate policies for shop members and the room's visitor.
--           Candidate injection into a foreign room is blocked at the DB layer.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "VideoCandidates INSERT public" ON public.video_candidates;

-- Authenticated shop member (seller / agent) can insert their own candidates
CREATE POLICY "VideoCandidates INSERT shop member" ON public.video_candidates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.video_rooms r
            WHERE r.id = video_candidates.room_id
            AND EXISTS (
                SELECT 1 FROM public.shops s
                WHERE s.id = r.shop_id
                AND (
                    s.owner_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM public.shop_members m
                        WHERE m.shop_id = s.id
                        AND m.profile_id = auth.uid()
                    )
                )
            )
        )
    );

-- The room's visitor (by email match) can insert their own candidates
CREATE POLICY "VideoCandidates INSERT visitor" ON public.video_candidates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.video_rooms r
            JOIN public.visitors v ON v.id = r.visitor_id
            WHERE r.id = video_candidates.room_id
              AND v.email = auth.jwt()->>'email'
        )
    );
