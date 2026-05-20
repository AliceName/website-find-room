"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Loader2,
  ArrowRight,
  Trash2,
  Bot,
  User,
  MapPinned,
} from "lucide-react";
import PostCard from "@/components/rooms/PostCard";
import type { RoomSearchMatch } from "@/lib/ai/room-search";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  rooms?: RoomSearchMatch[];
};

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Xin chào! Mình là trợ lý Find Room — bạn có thể mô tả nhu cầu thuê phòng (khu vực, giá, diện tích, tiện ích…). Mình sẽ hỏi thêm nếu cần và gợi ý phòng phù hợp từ tin đang có trên hệ thống.",
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function GeminiRoomSearchPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const resetChat = () => {
    setMessages([GREETING]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const parts = [
          typeof data?.error === "string"
            ? data.error
            : "Không thể trò chuyện với AI",
          typeof data?.code === "string" ? `(${data.code})` : null,
          typeof data?.retryAfter === "string"
            ? `Thử lại sau ~${data.retryAfter}.`
            : null,
        ].filter(Boolean);
        throw new Error(parts.join(" "));
      }

      const assistantMessage: ChatMessage = {
        id: newId(),
        role: "assistant",
        content:
          typeof data?.reply === "string"
            ? data.reply
            : "Mình chưa có câu trả lời phù hợp. Bạn thử mô tả lại nhé?",
        rooms: Array.isArray(data?.rooms) ? data.rooms : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] px-4 py-8 text-slate-800 md:py-12">
      <div className="mx-auto flex max-w-3xl flex-col rounded-[32px] border border-sky-100 bg-white shadow-2xl">
        <div className="border-b border-sky-100 px-6 py-5 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-[#0EA5E9]">
                <Sparkles className="h-6 w-6" />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  AI tìm phòng
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Trò chuyện tìm phòng
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Hỏi đáp nhiều lượt — AI nhớ ngữ cảnh và gợi ý phòng từ tin thật
                trên Supabase.
              </p>
            </div>
            <button
              type="button"
              onClick={resetChat}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sky-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-sky-50 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Xóa hội thoại
            </button>
          </div>
        </div>

        <div className="flex min-h-[420px] flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    message.role === "user"
                      ? "bg-[#0EA5E9] text-white"
                      : "bg-sky-100 text-[#0EA5E9]"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] space-y-3 ${message.role === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      message.role === "user"
                        ? "rounded-tr-md bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] font-medium text-white"
                        : "rounded-tl-md border border-sky-100 bg-slate-50 text-slate-800"
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.rooms && message.rooms.length > 0 ? (
                    <div className="space-y-4">
                      {message.rooms.map((post) => (
                        <div
                          key={post.post_id}
                          className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm"
                        >
                          <p className="border-b border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                            <span className="font-semibold">Gợi ý: </span>
                            {post.matchReason}
                          </p>
                          <div className="block p-2">
                            <PostCard post={post as any} />
                            <Link
                              href={`/rooms?focusPostId=${encodeURIComponent(post.post_id)}&focusLat=${encodeURIComponent(String(post.rooms?.latitude ?? ""))}&focusLng=${encodeURIComponent(String(post.rooms?.longitude ?? ""))}&focusTitle=${encodeURIComponent(post.post_title)}&openRoute=1`}
                              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-[#0EA5E9] transition hover:bg-sky-50"
                              scroll={false}
                            >
                              <MapPinned className="h-4 w-4" />
                              Xem trên bản đồ
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[#0EA5E9]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0EA5E9]" />
                  Đang suy nghĩ...
                </div>
              </div>
            ) : null}

            <div ref={listEndRef} />
          </div>

          {error ? (
            <div className="mx-4 mb-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-6">
              {error}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="border-t border-sky-100 px-4 py-4 md:px-6"
          >
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
                placeholder="Ví dụ: Phòng Thủ Đức dưới 4 triệu, có máy lạnh..."
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-sky-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Gửi tin nhắn"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              Enter để gửi · Shift+Enter xuống dòng
            </p>
          </form>
        </div>

        <div className="border-t border-sky-100 px-6 py-4 md:px-8">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0EA5E9] hover:underline"
          >
            Xem tất cả phòng
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
