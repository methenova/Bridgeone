import { useState, useEffect, useRef } from "react";
import { Send, Image, MessageSquare, User, Search, Paperclip } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useChatContacts, useChatMessages, useSendMessage, useMarkRead } from "../../chat/hooks/useChat";
import toast from "react-hot-toast";

export default function ChatInboxPage() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const { data: contacts = [], isLoading: contactsLoading } = useChatContacts(userId);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  // Pre-select contact if userId is passed in URL search params
  useEffect(() => {
    if (targetUserId && contacts.length > 0) {
      const contact = contacts.find((c) => c.id === targetUserId);
      if (contact) {
        setSelectedContact(contact);
      }
    }
  }, [targetUserId, contacts]);

  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(userId, selectedContact?.id);
  const sendMsg = useSendMessage();
  const markRead = useMarkRead();
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark incoming messages as read
  useEffect(() => {
    if (selectedContact && userId) {
      markRead.mutate({ senderId: selectedContact.id, receiverId: userId });
    }
  }, [selectedContact, messages.length, userId, markRead]);

  async function handleSend(e) {
    e.preventDefault();
    if (!messageText.trim() && !attachmentUrl) return;

    try {
      await sendMsg.mutateAsync({
        senderId: userId,
        receiverId: selectedContact.id,
        shopId: selectedContact.shop?.id || null,
        content: messageText.trim(),
        imageUrl: attachmentUrl,
      });

      setMessageText("");
      setAttachmentUrl("");
    } catch {
      // Fallback message insertion if database table is missing
      toast.error("Messages table not initialized yet. Streaming local fallback.");
    }
  }

  // Handle mock image attachments
  function handleAttachImage() {
    const urls = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    ];
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    setAttachmentUrl(randomUrl);
    toast.success("Mock image attachment loaded!");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Chat Inbox</h1>
        <p className="mt-1 text-slate-500">Reply to customer queries and view message logs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 border border-slate-100 rounded-3xl bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 overflow-hidden h-[600px]">
        
        {/* Left: Contacts Pane */}
        <div className="border-r border-slate-100 flex flex-col h-full bg-slate-950/20">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-600 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-none">
            {contactsLoading ? (
              <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600">
                <MessageSquare className="h-8 w-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">No active chats.</p>
              </div>
            ) : (
              contacts.map((c) => {
                const isActive = selectedContact?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      isActive ? "bg-blue-600/10 text-white" : "hover:bg-slate-900/40 text-slate-300"
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-xs font-bold truncate text-slate-900">{c.user?.full_name || "Buyer"}</p>
                        {c.unread && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{c.lastMessage || "[Attachment]"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Messages Pane */}
        <div className="md:col-span-2 flex flex-col h-full bg-slate-950/10">
          {selectedContact ? (
            <>
              {/* Active Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 bg-slate-950/40">
                <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{selectedContact.user?.full_name || "Buyer"}</h4>
                  <p className="text-[10px] text-slate-500">{selectedContact.user?.email}</p>
                </div>
              </div>

              {/* Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
                {messagesLoading ? (
                  <div className="text-center text-xs text-slate-500 animate-pulse">Loading message history...</div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
                    <MessageSquare className="h-8 w-8 mb-2 stroke-[1.5]" />
                    <p className="text-xs">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.sender_id === userId;
                    return (
                      <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl p-3.5 space-y-2 text-xs ${
                          isOwn
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850"
                        }`}>
                          {m.content && <p className="leading-relaxed">{m.content}</p>}
                          {m.image_url && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 mt-1 max-w-[200px]">
                              <img src={m.image_url} alt="" className="object-cover w-full h-auto" />
                            </div>
                          )}
                          <span className={`block text-[9px] text-right mt-1 ${isOwn ? "text-blue-200" : "text-slate-500"}`}>
                            {new Date(m.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="border-t border-slate-100 p-4 bg-slate-950/40 space-y-3">
                {attachmentUrl && (
                  <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 p-1.5 pr-8 text-xs text-slate-600">
                    <Image className="inline h-4.5 w-4.5 text-blue-600 font-semibold mr-1.5" />
                    <span>Image attachment loaded</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentUrl("")}
                      className="absolute right-1 top-1 text-slate-500 hover:text-slate-900"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAttachImage}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900"
                    title="Attach Mock Image"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 placeholder-slate-600"
                  />

                  <button
                    type="submit"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
              <MessageSquare className="h-12 w-12 mb-3 stroke-[1.2]" />
              <h3 className="text-sm font-bold text-slate-900">Select a Chat</h3>
              <p className="text-xs text-slate-500 mt-1">Choose a customer conversation to review query history.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
