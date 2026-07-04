import { supabase } from "@/config/supabase";

// Send message
export async function sendMessage({ senderId, receiverId, shopId, content, imageUrl = "" }) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      shop_id: shopId,
      content,
      image_url: imageUrl,
      read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch messages between two users
export async function getConversationMessages(userId, otherUserId) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id ( full_name, email ),
      receiver:receiver_id ( full_name, email )
    `)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Fetch active chat contacts list (sellers seeing customers, or customers seeing shops they chatted with)
export async function getChatContacts(userId) {
  // Get all messages where user is sender or receiver
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id ( id, full_name, email ),
      receiver:receiver_id ( id, full_name, email ),
      shops ( id, name:shop_name, logo_url )
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Group by other user id
  const contactsMap = {};
  data.forEach((msg) => {
    const isSender = msg.sender_id === userId;
    const contactUser = isSender ? msg.receiver : msg.sender;
    if (!contactUser) return;

    const contactId = contactUser.id;
    if (!contactsMap[contactId]) {
      contactsMap[contactId] = {
        id: contactId,
        user: contactUser,
        shop: msg.shops,
        lastMessage: msg.content,
        imageUrl: msg.image_url,
        unread: !msg.read && msg.receiver_id === userId,
        created_at: msg.created_at,
      };
    }
  });

  return Object.values(contactsMap);
}

// Mark messages in conversation as read
export async function markConversationRead(senderId, receiverId) {
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .eq("read", false);

  if (error) throw error;
}
