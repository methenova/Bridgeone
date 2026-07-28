import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/config/supabase";
import { getConversationMessages, getChatContacts, sendMessage, markConversationRead } from "../services/chat.service";
import toast from "react-hot-toast";

const chatKeys = {
  all: ["chat"],
  messages: (conversationId) => [...chatKeys.all, "messages", conversationId],
  contacts: (shopId) => [...chatKeys.all, "contacts", shopId],
};

export function useChatMessages(conversationId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    // Realtime listener for direct messages update
    const channel = supabase
      .channel(`chat-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: chatKeys.messages(conversationId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => getConversationMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000, // Safe polling fallback
  });
}

export function useChatContacts(shopId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!shopId) return;

    // Realtime listener for active contacts update (conversations modifications)
    const channel = supabase
      .channel(`chat-contacts-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: chatKeys.contacts(shopId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, queryClient]);

  return useQuery({
    queryKey: chatKeys.contacts(shopId),
    queryFn: () => getChatContacts(shopId),
    enabled: !!shopId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.contacts(variables.shopId) });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message");
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId }) => markConversationRead(conversationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.contacts(variables.shopId) });
    },
  });
}

export function useTypingIndicator(conversationId, userId, userName) {
  const [remoteTyping, setRemoteTyping] = useState(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing-${conversationId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "typing_indicator" }, (payload) => {
        const data = payload.payload;
        if (data.senderId !== userId) {
          setRemoteTyping(data.isTyping ? data.senderName : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, userId]);

  const sendTypingStatus = useCallback(
    (typingState) => {
      if (!conversationId || !channelRef.current) return;
      
      channelRef.current.send({
        type: "broadcast",
        event: "typing_indicator",
        payload: { senderId: userId, senderName: userName, isTyping: typingState },
      });
    },
    [conversationId, userId, userName]
  );

  return {
    remoteTyping,
    sendTypingStatus,
  };
}
