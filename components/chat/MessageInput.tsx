"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface MessageInputProps {
  conversationId: string;
  currentUserId: string;
  onSent?: (message: {
    message_id: string;
    conversation_id: string;
    sender_user_id: string;
    message_content: string;
    message_type: "text" | "system";
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    deleted_at: string | null;
  }) => void | Promise<void>;
}

export default function MessageInput({ conversationId, currentUserId, onSent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending) return;

    try {
      setSending(true);

      const { data: insertedMessage, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_user_id: currentUserId,
          message_content: content,
          message_type: "text",
        })
        .select("*")
        .single();

      if (insertError || !insertedMessage) {
        throw new Error(insertError?.message || "Không thể gửi tin nhắn");
      }

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          last_message_at: now,
          updated_at: now,
        })
        .eq("conversation_id", conversationId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setMessage("");
      window.dispatchEvent(new Event("chat:updated"));
      await onSent?.(insertedMessage);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Nhập tin nhắn..."
        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
        disabled={sending}
      />
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {sending ? "Đang gửi..." : "Gửi"}
      </button>
    </form>
  );
}
