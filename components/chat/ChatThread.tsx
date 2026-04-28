"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MessageInput from "./MessageInput";
import { Database } from "@/types/supabase";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

interface ChatThreadProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageRow[];
  onMessagesRead?: () => void;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatThread({ conversationId, currentUserId, initialMessages, onMessagesRead }: ChatThreadProps) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    setMessages((data || []) as MessageRow[]);
  }, [conversationId]);

  const handleSent = useCallback((sentMessage: MessageRow) => {
    setMessages((current) =>
      current.some((item) => item.message_id === sentMessage.message_id)
        ? current
        : [...current, sentMessage],
    );
    window.dispatchEvent(new Event("chat:updated"));
  }, []);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const sync = () => void loadMessages();
    window.addEventListener("chat:updated", sync);
    return () => window.removeEventListener("chat:updated", sync);
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const nextMessage = payload.new as MessageRow;
          setMessages((current) =>
            current.some((item) => item.message_id === nextMessage.message_id)
              ? current
              : [...current, nextMessage],
          );
          window.dispatchEvent(new Event("chat:updated"));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as MessageRow;
          setMessages((current) =>
            current.map((item) => (item.message_id === updatedMessage.message_id ? updatedMessage : item)),
          );
          window.dispatchEvent(new Event("chat:updated"));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages]);

  useEffect(() => {
    const markRead = async () => {
      const { error } = await supabase
        .from("messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .neq("sender_user_id", currentUserId)
        .is("deleted_at", null);

      if (!error) {
        onMessagesRead?.();
      }
    };

    void markRead();
  }, [conversationId, currentUserId, onMessagesRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const messageList = useMemo(() => messages, [messages]);

  return (
    <div className="space-y-4">
      <section className="max-h-[58vh] overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-500 ease-out md:p-5">
        <div className="space-y-3">
          {messageList.length === 0 ? (
            <div className="py-14 text-center opacity-80 transition-opacity duration-300">
              <p className="text-lg font-bold text-slate-900">Chưa có tin nhắn nào</p>
              <p className="mt-2 text-sm text-slate-500">Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi.</p>
            </div>
          ) : (
            messageList.map((message) => {
              const isMine = message.sender_user_id === currentUserId;
              const isSystem = message.message_type === "system";
              return (
                <div
                  key={message.message_id}
                  className={`flex animate-[fadeIn_.28s_ease-out] ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`group max-w-[80%] rounded-[1.4rem] px-4 py-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                      isSystem
                        ? "border border-amber-200 bg-amber-50 text-amber-900"
                        : isMine
                          ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-900"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em]">
                      {isSystem ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                          <span>⚙️</span>
                          Thông báo hệ thống
                        </span>
                      ) : null}
                    </div>
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.message_content}</p>
                    <div className={`mt-2 flex items-center justify-between gap-3 text-[11px] ${isMine ? "text-blue-100" : isSystem ? "text-amber-600" : "text-slate-500"}`}>
                      <span>{formatTime(message.created_at)}</span>
                      {isMine && (
                        <span className="rounded-full bg-white/15 px-2 py-0.5 font-semibold">
                          {message.is_read ? "Đã đọc" : "Đã gửi"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </section>

      <MessageInput conversationId={conversationId} currentUserId={currentUserId} onSent={handleSent} />
    </div>
  );
}
