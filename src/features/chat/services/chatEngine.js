import { supabase } from "@/config/supabase";

/**
 * Reusable Production Chat Engine Service
 * Uncoupled from video and prepared for AI assistant execution.
 */
export class ChatEngine {
  /**
   * Send a chat message (text, quick replies, or files like Images & PDFs)
   */
  static async sendMessage({
    conversationId,
    senderType, // 'visitor' | 'business_member'
    senderShopMemberId = null,
    visitorId = null,
    content,
    messageType = "text", // 'text' | 'image' | 'file' | 'quick_reply'
    fileUrl = null,
    fileName = null,
    fileType = null,
    fileSize = null,
    metadata = {}
  }) {
    try {
      const payload = {
        conversation_id: conversationId,
        sender_type: senderType,
        sender_shop_member_id: senderShopMemberId,
        visitor_id: visitorId,
        content,
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        delivery_status: "sent",
        is_read: false,
        metadata: {
          ...metadata,
          quick_replies: metadata.quick_replies || null,
          emoji: metadata.emoji || null
        }
      };

      const { data: message, error } = await supabase
        .from("messages")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Update conversation last activity timestamp
      await supabase
        .from("conversations")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Check if AI auto-responder is active on this conversation
      const { data: convo } = await supabase
        .from("conversations")
        .select("metadata")
        .eq("id", conversationId)
        .maybeSingle();

      if (convo?.metadata?.ai_enabled === true && senderType === "visitor") {
        this.scheduleAIResponse(conversationId, content);
      }

      return { success: true, message };
    } catch (err) {
      console.error("[ChatEngine] sendMessage failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Mark message status as delivered
   */
  static async markDelivered(messageId) {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ delivery_status: "delivered" })
        .eq("id", messageId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn("[ChatEngine] markDelivered failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Mark message status as read
   */
  static async markRead(messageId) {
    try {
      const { error } = await supabase
        .from("messages")
        .update({
          delivery_status: "read",
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq("id", messageId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn("[ChatEngine] markRead failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Broadcast real-time typing indicator over WebSocket channels
   */
  static broadcastTyping(conversationId, senderId, senderName, isTyping) {
    const channel = supabase.channel(`conversation:${conversationId}`);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "typing_indicator",
          payload: { senderId, senderName, isTyping }
        });
        // Gracefully clean channel reference
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    });
  }

  /**
   * Subscribe to real-time messages and typing states for a conversation
   */
  static subscribe(conversationId, { onMessage, onTyping }) {
    const channel = supabase.channel(`chat-room-${conversationId}`);

    // Listen to real-time typing broadcasts
    channel.on("broadcast", { event: "typing_indicator" }, (payload) => {
      if (onTyping) {
        onTyping(payload.payload);
      }
    });

    // Listen to database inserts/updates
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        if (onMessage) {
          onMessage(payload.new);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Assign conversation assignee ownership (Routing / escalation)
   */
  static async assignConversation(conversationId, agentId) {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({
          agent_id: agentId,
          status: "assigned",
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("[ChatEngine] assignConversation failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Toggle AI assistant responder
   */
  static async toggleAIAssistant(conversationId, enabled) {
    try {
      const { data: convo } = await supabase
        .from("conversations")
        .select("metadata")
        .eq("id", conversationId)
        .maybeSingle();

      const updatedMetadata = {
        ...(convo?.metadata || {}),
        ai_enabled: enabled
      };

      const { error } = await supabase
        .from("conversations")
        .update({ metadata: updatedMetadata })
        .eq("id", conversationId);

      if (error) throw error;
      return { success: true, ai_enabled: enabled };
    } catch (err) {
      console.error("[ChatEngine] toggleAIAssistant failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Schedule automated AI assistant response (AI Assistant architecture handler)
   */
  static scheduleAIResponse(conversationId, visitorMessage) {
    console.info(`[AI-Assistant] Scheduling automated reply task for conversation ${conversationId}`);
    
    // Simulate background worker trigger (Vercel serverless / Edge function queue)
    setTimeout(async () => {
      try {
        const aiResponse = `Hello! I am your AI Assistant. I received your message: "${visitorMessage}". How else can I help you today?`;
        
        await this.sendMessage({
          conversationId,
          senderType: "business_member",
          content: aiResponse,
          metadata: {
            is_ai: true,
            quick_replies: ["Chat with Agent", "View Catalog"]
          }
        });

      } catch (err) {
        console.warn("[AI-Assistant] Automated reply delivery failed:", err);
      }
    }, 1500);
  }
}
