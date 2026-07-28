-- Migration: Activate RLS and enforce strict access policies on 30 unsecured tables
-- Date: 2026-07-27

-- 1. Enable RLS on all 30 tables
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 2. Define Secure Policies

-- platform_admins
DROP POLICY IF EXISTS "PlatformAdmins admin view" ON public.platform_admins;
CREATE POLICY "PlatformAdmins admin view" ON public.platform_admins
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- shop_members
DROP POLICY IF EXISTS "ShopMembers SELECT member or owner" ON public.shop_members;
CREATE POLICY "ShopMembers SELECT member or owner" ON public.shop_members
    FOR SELECT USING (shop_members.profile_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_members.shop_id AND shops.owner_id = auth.uid()));

DROP POLICY IF EXISTS "ShopMembers manage owner" ON public.shop_members;
CREATE POLICY "ShopMembers manage owner" ON public.shop_members
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_members.shop_id AND shops.owner_id = auth.uid()));

-- shop_agents
DROP POLICY IF EXISTS "ShopAgents SELECT member or owner" ON public.shop_agents;
CREATE POLICY "ShopAgents SELECT member or owner" ON public.shop_agents
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.shop_members m1 JOIN public.shop_members m2 ON m1.shop_id = m2.shop_id WHERE m1.profile_id = auth.uid() AND m2.id = shop_agents.shop_member_id));

DROP POLICY IF EXISTS "ShopAgents manage owner" ON public.shop_agents;
CREATE POLICY "ShopAgents manage owner" ON public.shop_agents
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shop_members m JOIN public.shops s ON s.id = m.shop_id WHERE m.id = shop_agents.shop_member_id AND s.owner_id = auth.uid()));

-- shop_domains
DROP POLICY IF EXISTS "ShopDomains SELECT public" ON public.shop_domains;
CREATE POLICY "ShopDomains SELECT public" ON public.shop_domains
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ShopDomains manage owner" ON public.shop_domains;
CREATE POLICY "ShopDomains manage owner" ON public.shop_domains
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_domains.shop_id AND shops.owner_id = auth.uid()));

-- widget_settings
DROP POLICY IF EXISTS "WidgetSettings SELECT public" ON public.widget_settings;
CREATE POLICY "WidgetSettings SELECT public" ON public.widget_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "WidgetSettings manage owner" ON public.widget_settings;
CREATE POLICY "WidgetSettings manage owner" ON public.widget_settings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = widget_settings.shop_id AND shops.owner_id = auth.uid()));

-- shop_business_hours
DROP POLICY IF EXISTS "ShopBusinessHours SELECT public" ON public.shop_business_hours;
CREATE POLICY "ShopBusinessHours SELECT public" ON public.shop_business_hours
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ShopBusinessHours manage owner" ON public.shop_business_hours;
CREATE POLICY "ShopBusinessHours manage owner" ON public.shop_business_hours
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_business_hours.shop_id AND shops.owner_id = auth.uid()));

-- products
DROP POLICY IF EXISTS "Products SELECT public" ON public.products;
CREATE POLICY "Products SELECT public" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products manage owner" ON public.products;
CREATE POLICY "Products manage owner" ON public.products
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = products.shop_id AND (shops.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = shops.id AND m.profile_id = auth.uid()))));

-- visitors
DROP POLICY IF EXISTS "Visitors SELECT own or shop member" ON public.visitors;
CREATE POLICY "Visitors SELECT own or shop member" ON public.visitors
    FOR SELECT USING (visitors.email = auth.jwt()->>'email' OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = visitors.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "Visitors INSERT public" ON public.visitors;
CREATE POLICY "Visitors INSERT public" ON public.visitors
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Visitors UPDATE own or shop member" ON public.visitors;
CREATE POLICY "Visitors UPDATE own or shop member" ON public.visitors
    FOR UPDATE USING (visitors.email = auth.jwt()->>'email' OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = visitors.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "Visitors DELETE owner" ON public.visitors;
CREATE POLICY "Visitors DELETE owner" ON public.visitors
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = visitors.shop_id AND shops.owner_id = auth.uid()));

-- visitor_sessions
DROP POLICY IF EXISTS "VisitorSessions SELECT own or shop member" ON public.visitor_sessions;
CREATE POLICY "VisitorSessions SELECT own or shop member" ON public.visitor_sessions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = visitor_sessions.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = visitor_sessions.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "VisitorSessions INSERT public" ON public.visitor_sessions;
CREATE POLICY "VisitorSessions INSERT public" ON public.visitor_sessions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "VisitorSessions UPDATE own or shop member" ON public.visitor_sessions;
CREATE POLICY "VisitorSessions UPDATE own or shop member" ON public.visitor_sessions
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = visitor_sessions.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = visitor_sessions.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "VisitorSessions DELETE owner" ON public.visitor_sessions;
CREATE POLICY "VisitorSessions DELETE owner" ON public.visitor_sessions
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = visitor_sessions.shop_id AND shops.owner_id = auth.uid()));

-- visitor_events
DROP POLICY IF EXISTS "VisitorEvents SELECT own or shop member" ON public.visitor_events;
CREATE POLICY "VisitorEvents SELECT own or shop member" ON public.visitor_events
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = visitor_events.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = visitor_events.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "VisitorEvents INSERT public" ON public.visitor_events;
CREATE POLICY "VisitorEvents INSERT public" ON public.visitor_events
    FOR INSERT WITH CHECK (true);

-- conversations
DROP POLICY IF EXISTS "Conversations SELECT own or shop member" ON public.conversations;
CREATE POLICY "Conversations SELECT own or shop member" ON public.conversations
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = conversations.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = conversations.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "Conversations INSERT public" ON public.conversations;
CREATE POLICY "Conversations INSERT public" ON public.conversations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Conversations UPDATE own or shop member" ON public.conversations;
CREATE POLICY "Conversations UPDATE own or shop member" ON public.conversations
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = conversations.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = conversations.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "Conversations DELETE owner" ON public.conversations;
CREATE POLICY "Conversations DELETE owner" ON public.conversations
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = conversations.shop_id AND shops.owner_id = auth.uid()));

-- messages
DROP POLICY IF EXISTS "Messages SELECT own or shop member" ON public.messages;
CREATE POLICY "Messages SELECT own or shop member" ON public.messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = c.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = c.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))))));

DROP POLICY IF EXISTS "Messages INSERT public" ON public.messages;
CREATE POLICY "Messages INSERT public" ON public.messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Messages DELETE owner" ON public.messages;
CREATE POLICY "Messages DELETE owner" ON public.messages
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.conversations c JOIN public.shops s ON s.id = c.shop_id WHERE c.id = messages.conversation_id AND s.owner_id = auth.uid()));

-- message_attachments
DROP POLICY IF EXISTS "MessageAttachments SELECT public" ON public.message_attachments;
CREATE POLICY "MessageAttachments SELECT public" ON public.message_attachments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "MessageAttachments INSERT public" ON public.message_attachments;
CREATE POLICY "MessageAttachments INSERT public" ON public.message_attachments
    FOR INSERT WITH CHECK (true);

-- video_rooms
DROP POLICY IF EXISTS "VideoRooms SELECT own or shop member" ON public.video_rooms;
CREATE POLICY "VideoRooms SELECT own or shop member" ON public.video_rooms
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = video_rooms.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = video_rooms.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "VideoRooms INSERT public" ON public.video_rooms;
CREATE POLICY "VideoRooms INSERT public" ON public.video_rooms
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "VideoRooms UPDATE own or shop member" ON public.video_rooms;
CREATE POLICY "VideoRooms UPDATE own or shop member" ON public.video_rooms
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = video_rooms.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = video_rooms.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "VideoRooms DELETE owner" ON public.video_rooms;
CREATE POLICY "VideoRooms DELETE owner" ON public.video_rooms
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = video_rooms.shop_id AND shops.owner_id = auth.uid()));

-- video_candidates
DROP POLICY IF EXISTS "VideoCandidates SELECT own or shop member" ON public.video_candidates;
CREATE POLICY "VideoCandidates SELECT own or shop member" ON public.video_candidates
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.video_rooms r WHERE r.id = video_candidates.room_id AND (EXISTS (SELECT 1 FROM public.visitors v WHERE v.id = r.visitor_id AND v.email = auth.jwt()->>'email') OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = r.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))))));

DROP POLICY IF EXISTS "VideoCandidates INSERT public" ON public.video_candidates;
CREATE POLICY "VideoCandidates INSERT public" ON public.video_candidates
    FOR INSERT WITH CHECK (true);

-- call_logs
DROP POLICY IF EXISTS "CallLogs SELECT shop member" ON public.call_logs;
CREATE POLICY "CallLogs SELECT shop member" ON public.call_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = call_logs.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "CallLogs INSERT public" ON public.call_logs;
CREATE POLICY "CallLogs INSERT public" ON public.call_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "CallLogs UPDATE owner" ON public.call_logs;
CREATE POLICY "CallLogs UPDATE owner" ON public.call_logs
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = call_logs.shop_id AND shops.owner_id = auth.uid()));

DROP POLICY IF EXISTS "CallLogs DELETE owner" ON public.call_logs;
CREATE POLICY "CallLogs DELETE owner" ON public.call_logs
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = call_logs.shop_id AND shops.owner_id = auth.uid()));

-- call_feedback
DROP POLICY IF EXISTS "CallFeedback SELECT shop member" ON public.call_feedback;
CREATE POLICY "CallFeedback SELECT shop member" ON public.call_feedback
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.call_logs c JOIN public.shops s ON s.id = c.shop_id WHERE c.id = call_feedback.call_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "CallFeedback INSERT public" ON public.call_feedback;
CREATE POLICY "CallFeedback INSERT public" ON public.call_feedback
    FOR INSERT WITH CHECK (true);

-- callback_requests
DROP POLICY IF EXISTS "CallbackRequests SELECT shop member" ON public.callback_requests;
CREATE POLICY "CallbackRequests SELECT shop member" ON public.callback_requests
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = callback_requests.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "CallbackRequests INSERT public" ON public.callback_requests;
CREATE POLICY "CallbackRequests INSERT public" ON public.callback_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "CallbackRequests UPDATE shop member" ON public.callback_requests;
CREATE POLICY "CallbackRequests UPDATE shop member" ON public.callback_requests
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = callback_requests.shop_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = s.id AND m.profile_id = auth.uid()))));

DROP POLICY IF EXISTS "CallbackRequests DELETE owner" ON public.callback_requests;
CREATE POLICY "CallbackRequests DELETE owner" ON public.callback_requests
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = callback_requests.shop_id AND shops.owner_id = auth.uid()));

-- product_shares
DROP POLICY IF EXISTS "ProductShares SELECT public" ON public.product_shares;
CREATE POLICY "ProductShares SELECT public" ON public.product_shares
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ProductShares INSERT public" ON public.product_shares;
CREATE POLICY "ProductShares INSERT public" ON public.product_shares
    FOR INSERT WITH CHECK (true);

-- shop_integrations
DROP POLICY IF EXISTS "ShopIntegrations manage owner" ON public.shop_integrations;
CREATE POLICY "ShopIntegrations manage owner" ON public.shop_integrations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_integrations.shop_id AND shops.owner_id = auth.uid()));

-- subscription_plans
DROP POLICY IF EXISTS "SubscriptionPlans SELECT public" ON public.subscription_plans;
CREATE POLICY "SubscriptionPlans SELECT public" ON public.subscription_plans
    FOR SELECT USING (true);

-- shop_subscriptions
DROP POLICY IF EXISTS "ShopSubscriptions manage owner" ON public.shop_subscriptions;
CREATE POLICY "ShopSubscriptions manage owner" ON public.shop_subscriptions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_subscriptions.shop_id AND shops.owner_id = auth.uid()));

-- usage_records
DROP POLICY IF EXISTS "UsageRecords SELECT owner" ON public.usage_records;
CREATE POLICY "UsageRecords SELECT owner" ON public.usage_records
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = usage_records.shop_id AND shops.owner_id = auth.uid()));

-- agent_activity_logs
DROP POLICY IF EXISTS "AgentActivityLogs SELECT shop member" ON public.agent_activity_logs;
CREATE POLICY "AgentActivityLogs SELECT shop member" ON public.agent_activity_logs
    FOR SELECT USING (agent_activity_logs.agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shop_members m JOIN public.shops s ON s.id = m.shop_id WHERE m.profile_id = agent_activity_logs.agent_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "AgentActivityLogs INSERT member" ON public.agent_activity_logs;
CREATE POLICY "AgentActivityLogs INSERT member" ON public.agent_activity_logs
    FOR INSERT WITH CHECK (agent_activity_logs.agent_id = auth.uid());

-- support_tickets
DROP POLICY IF EXISTS "SupportTickets manage owner" ON public.support_tickets;
CREATE POLICY "SupportTickets manage owner" ON public.support_tickets
    FOR ALL USING (support_tickets.created_by_profile_id = auth.uid());

-- support_ticket_messages
DROP POLICY IF EXISTS "SupportTicketMessages SELECT participant" ON public.support_ticket_messages;
CREATE POLICY "SupportTicketMessages SELECT participant" ON public.support_ticket_messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.support_tickets WHERE support_tickets.id = support_ticket_messages.ticket_id AND support_tickets.created_by_profile_id = auth.uid()));

DROP POLICY IF EXISTS "SupportTicketMessages INSERT participant" ON public.support_ticket_messages;
CREATE POLICY "SupportTicketMessages INSERT participant" ON public.support_ticket_messages
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets WHERE support_tickets.id = support_ticket_messages.ticket_id AND support_tickets.created_by_profile_id = auth.uid()));

-- platform_announcements
DROP POLICY IF EXISTS "PlatformAnnouncements SELECT public" ON public.platform_announcements;
CREATE POLICY "PlatformAnnouncements SELECT public" ON public.platform_announcements
    FOR SELECT USING (true);

-- shop_admin_notes
DROP POLICY IF EXISTS "ShopAdminNotes admin view" ON public.shop_admin_notes;
CREATE POLICY "ShopAdminNotes admin view" ON public.shop_admin_notes
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- admin_activity_logs
DROP POLICY IF EXISTS "AdminActivityLogs admin view" ON public.admin_activity_logs;
CREATE POLICY "AdminActivityLogs admin view" ON public.admin_activity_logs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- platform_settings
DROP POLICY IF EXISTS "PlatformSettings SELECT public" ON public.platform_settings;
CREATE POLICY "PlatformSettings SELECT public" ON public.platform_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "PlatformSettings admin edit" ON public.platform_settings;
CREATE POLICY "PlatformSettings admin edit" ON public.platform_settings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
