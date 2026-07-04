import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversationMessages, getChatContacts, sendMessage, markConversationRead } from "../services/chat.service";
import toast from "react-hot-toast";

const chatKeys = {
  all: ["chat"],
  messages: (userId, otherId) => [...chatKeys.all, "messages", userId, otherId],
  contacts: (userId) => [...chatKeys.all, "contacts", userId],
};

export function useChatMessages(userId, otherUserId) {
  return useQuery({
    queryKey: chatKeys.messages(userId, otherUserId),
    queryFn: () => getConversationMessages(userId, otherUserId),
    enabled: !!userId && !!otherUserId,
    refetchInterval: 3000, // Poll every 3 seconds for realtime fallback if subscription fails
  });
}

export function useChatContacts(userId) {
  return useQuery({
    queryKey: chatKeys.contacts(userId),
    queryFn: () => getChatContacts(userId),
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.sender_id, data.receiver_id) });
      queryClient.invalidateQueries({ queryKey: chatKeys.contacts(data.sender_id) });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message");
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ senderId, receiverId }) => markConversationRead(senderId, receiverId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.senderId, variables.receiverId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.contacts(variables.receiverId) });
    },
  });
}
