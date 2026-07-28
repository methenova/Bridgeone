-- Migration: Harden Row Level Security (RLS) policies by removing FOR ALL wildcards
-- Date: 2026-07-24

-- ====================================================================
-- 1. SHOPS
-- ====================================================================
DROP POLICY IF EXISTS "Owners can manage own shops" ON public.shops;

CREATE POLICY "Shops SELECT public verified or owner" ON public.shops
    FOR SELECT USING (is_verified = true OR auth.uid() = owner_id);

CREATE POLICY "Shops INSERT owner" ON public.shops
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shops UPDATE owner" ON public.shops
    FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shops DELETE owner" ON public.shops
    FOR DELETE USING (auth.uid() = owner_id);


-- ====================================================================
-- 2. WIDGET CREDENTIALS
-- ====================================================================
DROP POLICY IF EXISTS "Owners can view own widget credentials" ON public.widget_credentials;
DROP POLICY IF EXISTS "Owners can view own secure credentials" ON public.widget_credentials;

CREATE POLICY "WidgetCredentials SELECT owner" ON public.widget_credentials
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "WidgetCredentials INSERT owner" ON public.widget_credentials
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "WidgetCredentials UPDATE owner" ON public.widget_credentials
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "WidgetCredentials DELETE owner" ON public.widget_credentials
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid()));


-- ====================================================================
-- 3. SUBSCRIPTIONS
-- ====================================================================
DROP POLICY IF EXISTS "Owners can manage own subscriptions" ON public.subscriptions;

CREATE POLICY "Subscriptions SELECT user" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions INSERT user" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Subscriptions UPDATE user" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Subscriptions DELETE user" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);


-- ====================================================================
-- 4. DEVICE TOKENS
-- ====================================================================
DROP POLICY IF EXISTS "Users can manage own device tokens" ON public.device_tokens;

CREATE POLICY "DeviceTokens SELECT user" ON public.device_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "DeviceTokens INSERT user" ON public.device_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "DeviceTokens UPDATE user" ON public.device_tokens
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "DeviceTokens DELETE user" ON public.device_tokens
    FOR DELETE USING (auth.uid() = user_id);


-- ====================================================================
-- 5. ORGANIZATIONS
-- ====================================================================
DROP POLICY IF EXISTS "Owners can manage own organization" ON public.organizations;

CREATE POLICY "Organizations SELECT owner" ON public.organizations
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Organizations INSERT owner" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organizations UPDATE owner" ON public.organizations
    FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organizations DELETE owner" ON public.organizations
    FOR DELETE USING (auth.uid() = owner_id);


-- ====================================================================
-- 6. AUDIT LOGS (Read-only logs)
-- ====================================================================
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

CREATE POLICY "AuditLogs SELECT user" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "AuditLogs INSERT user" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ====================================================================
-- 7. NOTIFICATIONS
-- ====================================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Notifications SELECT user or shop owner" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

CREATE POLICY "Notifications INSERT public" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Notifications UPDATE user or shop owner" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

CREATE POLICY "Notifications DELETE user or shop owner" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));


-- ====================================================================
-- 8. NOTIFICATION PREFERENCES
-- ====================================================================
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.notification_preferences;

CREATE POLICY "NotificationPreferences SELECT user" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "NotificationPreferences INSERT user" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "NotificationPreferences UPDATE user" ON public.notification_preferences
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "NotificationPreferences DELETE user" ON public.notification_preferences
    FOR DELETE USING (auth.uid() = user_id);


-- ====================================================================
-- 9. NOTIFICATION LOGS (Read-only logs)
-- ====================================================================
DROP POLICY IF EXISTS "Users can view own notification logs" ON public.notification_logs;

CREATE POLICY "NotificationLogs SELECT user" ON public.notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "NotificationLogs INSERT user" ON public.notification_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ====================================================================
-- 10. AGENT PRESENCE
-- ====================================================================
DROP POLICY IF EXISTS "Users can manage own presence" ON public.agent_presence;
DROP POLICY IF EXISTS "Anyone can view presence records" ON public.agent_presence;

CREATE POLICY "AgentPresence SELECT public" ON public.agent_presence
    FOR SELECT USING (true);

CREATE POLICY "AgentPresence INSERT user" ON public.agent_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "AgentPresence UPDATE user" ON public.agent_presence
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "AgentPresence DELETE user" ON public.agent_presence
    FOR DELETE USING (auth.uid() = user_id);


-- ====================================================================
-- 11. CALL QUEUES
-- ====================================================================
DROP POLICY IF EXISTS "Anyone can manage their own queue records" ON public.call_queues;

CREATE POLICY "CallQueues SELECT public" ON public.call_queues
    FOR SELECT USING (true);

CREATE POLICY "CallQueues INSERT public" ON public.call_queues
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CallQueues UPDATE public" ON public.call_queues
    FOR UPDATE USING (true);

CREATE POLICY "CallQueues DELETE public" ON public.call_queues
    FOR DELETE USING (true);


-- ====================================================================
-- 12. VISITORS
-- ====================================================================
DROP POLICY IF EXISTS "Allow public inserts and updates for visitors" ON public.visitors;

CREATE POLICY "Visitors SELECT public" ON public.visitors
    FOR SELECT USING (true);

CREATE POLICY "Visitors INSERT public" ON public.visitors
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Visitors UPDATE public" ON public.visitors
    FOR UPDATE USING (true);

CREATE POLICY "Visitors DELETE owner" ON public.visitors
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));


-- ====================================================================
-- 13. CONVERSATIONS
-- ====================================================================
DROP POLICY IF EXISTS "Allow public inserts and updates for conversations" ON public.conversations;

CREATE POLICY "Conversations SELECT public" ON public.conversations
    FOR SELECT USING (true);

CREATE POLICY "Conversations INSERT public" ON public.conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Conversations UPDATE public" ON public.conversations
    FOR UPDATE USING (true);

CREATE POLICY "Conversations DELETE owner" ON public.conversations
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));


-- ====================================================================
-- 14. MESSAGES
-- ====================================================================
DROP POLICY IF EXISTS "Allow public inserts and updates for messages" ON public.messages;

CREATE POLICY "Messages SELECT public" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Messages INSERT public" ON public.messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Messages UPDATE public" ON public.messages
    FOR UPDATE USING (true);

CREATE POLICY "Messages DELETE owner" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            JOIN public.shops s ON s.id = c.shop_id 
            WHERE c.id = conversation_id AND s.owner_id = auth.uid()
        )
    );


-- ====================================================================
-- 15. PRODUCTS
-- ====================================================================
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Owners can manage own products" ON public.products;

CREATE POLICY "Products SELECT public" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Products INSERT owner" ON public.products
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

CREATE POLICY "Products UPDATE owner" ON public.products
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

CREATE POLICY "Products DELETE owner" ON public.products
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));


-- ====================================================================
-- 16. VIDEO ROOMS
-- ====================================================================
DROP POLICY IF EXISTS "Allow public access to video rooms" ON public.video_rooms;

CREATE POLICY "VideoRooms SELECT public" ON public.video_rooms
    FOR SELECT USING (true);

CREATE POLICY "VideoRooms INSERT public" ON public.video_rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "VideoRooms UPDATE public" ON public.video_rooms
    FOR UPDATE USING (true);

CREATE POLICY "VideoRooms DELETE owner" ON public.video_rooms
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));


-- ====================================================================
-- 17. CALL LOGS
-- ====================================================================
DROP POLICY IF EXISTS "Allow public inserts and updates for call logs" ON public.call_logs;

CREATE POLICY "CallLogs SELECT owner" ON public.call_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

CREATE POLICY "CallLogs INSERT public" ON public.call_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CallLogs UPDATE public" ON public.call_logs
    FOR UPDATE USING (true);

CREATE POLICY "CallLogs DELETE owner" ON public.call_logs
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));


-- ====================================================================
-- 18. CALLBACK REQUESTS
-- ====================================================================
DROP POLICY IF EXISTS "Allow public inserts and updates for callback requests" ON public.callback_requests;

CREATE POLICY "CallbackRequests SELECT owner" ON public.callback_requests
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

CREATE POLICY "CallbackRequests INSERT public" ON public.callback_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CallbackRequests UPDATE owner" ON public.callback_requests
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

CREATE POLICY "CallbackRequests DELETE owner" ON public.callback_requests
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));


-- ====================================================================
-- 19. CATEGORIES (Read-only for public, restricted write)
-- ====================================================================
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;

CREATE POLICY "Categories SELECT public" ON public.categories
    FOR SELECT USING (true);
