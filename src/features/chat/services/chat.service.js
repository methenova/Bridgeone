import { supabase } from "@/config/supabase";

// Send message
export async function sendMessage({ senderId, receiverId, shopId, content, imageUrl = "", visitorId, conversationId }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const apiKey = window.BridgeOneShopApiKey || "";
    const { data, error } = await supabase.functions.invoke("guest-gateway", {
      body: {
        action: "send_message",
        shopId,
        apiKey,
        senderId,
        receiverId,
        content,
        imageUrl,
        visitorId,
        conversationId,
      }
    });
    if (error) throw error;
    return data;
  }

  // Authenticated path: insert directly
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      visitor_id: visitorId || null,
      sender_type: "business_member",
      sender_shop_member_id: senderId || null,
      message_type: "text",
      content,
      metadata: imageUrl ? { image_url: imageUrl } : {},
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch messages for a conversation
export async function getConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Fetch active chat contacts list (conversations for a shop)
export async function getChatContacts(shopId) {
  const { data: convos, error: convoErr } = await supabase
    .from("conversations")
    .select(`
      id,
      shop_id,
      visitor_id,
      channel,
      status,
      subject,
      last_activity_at,
      visitors ( id, name, email, phone, status )
    `)
    .eq("shop_id", shopId)
    .in("status", ["waiting", "assigned", "active"])
    .order("last_activity_at", { ascending: false });

  if (convoErr) throw convoErr;

  // Fetch unread messages for this shop's conversations
  const { data: unreadMsgs, error: msgErr } = await supabase
    .from("messages")
    .select("conversation_id, conversations!inner(shop_id)")
    .eq("is_read", false)
    .eq("sender_type", "visitor")
    .eq("conversations.shop_id", shopId);

  // If there's an error fetching messages, just return conversations as-is
  if (msgErr || !unreadMsgs) {
    return convos ?? [];
  }

  const unreadConvoIds = new Set(unreadMsgs.map(m => m.conversation_id));

  return (convos ?? []).map(convo => ({
    ...convo,
    unread: unreadConvoIds.has(convo.id)
  }));
}

// Mark messages in conversation as read
export async function markConversationRead(conversationId) {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("is_read", false);

  if (error) throw error;
}
