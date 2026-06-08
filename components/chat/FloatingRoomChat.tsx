"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";

type ChatRole = "user" | "assistant";

type ChatRoom = {
  post_id: string;
  post_title: string;
  matchReason?: string;
  rooms?: {
    room_price?: number | null;
    room_area?: number | null;
    room_description?: string | null;
    full_address?: string | null;
    address_detail?: string | null;
    room_types?: { room_type_name?: string | null } | null;
    locations?: {
      city?: string | null;
      district?: string | null;
      ward?: string | null;
    } | null;
  } | null;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  rooms?: ChatRoom[];
};

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Bạn mô tả phòng cần tìm nhé. Mình có thể hỏi thêm nếu thiếu thông tin, rồi gợi ý phòng phù hợp từ dữ liệu hiện có.",
};

const SUGGESTIONS = [
  "Phòng Thủ Đức dưới 4 triệu, có máy lạnh",
  "Tìm phòng gần Quận 1, ưu tiên có chỗ để xe",
  "Mình cần phòng rộng khoảng 25m2, giá mềm",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatPrice(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "Chưa rõ giá";
  const price = Number(value);
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")} triệu/tháng`;
  }
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
}

function formatLocation(room: ChatRoom["rooms"]) {
  const loc = room?.locations;
  return (
    room?.full_address ||
    room?.address_detail ||
    [loc?.ward, loc?.district, loc?.city].filter(Boolean).join(", ") ||
    "Chưa rõ khu vực"
  );
}

const CHAT_RESULTS_STORAGE_KEY = "findroom:pending-chat-results";
const CHAT_RESULTS_EVENT = "findroom:chat-room-results";

function buildChatResultsPayload(rooms: ChatRoom[], focusPostId?: string) {
  return {
    postIds: rooms.map((room) => room.post_id).filter(Boolean),
    focusPostId,
    source: "chatbot",
  };
}

function RoomResult({
  room,
  canShowOnRoomsPage,
  onShowOnRoomsPage,
}: {
  room: ChatRoom;
  canShowOnRoomsPage: boolean;
  onShowOnRoomsPage: (rooms: ChatRoom[], focusPostId?: string) => void;
}) {
  const details = room.rooms;

  return (
    <article className="rounded-lg border border-sky-100 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
            {room.post_title}
          </p>
          <p className="mt-1 text-xs font-semibold text-sky-700">
            {formatPrice(details?.room_price)}
            {details?.room_area ? ` · ${details.room_area} m²` : ""}
          </p>
        </div>
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
        {formatLocation(details)}
      </p>

      {room.matchReason ? (
        <p className="mt-2 rounded-md bg-emerald-50 px-2 py-1.5 text-xs leading-relaxed text-emerald-800">
          {room.matchReason}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/rooms/${room.post_id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-100 px-2.5 py-1.5 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
        >
          Xem chi tiết
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        {canShowOnRoomsPage ? (
          <button
            type="button"
            onClick={() => onShowOnRoomsPage([room], room.post_id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-sky-700"
          >
            <MapPin className="h-3.5 w-3.5" />
            Xem trên bản đồ
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function FloatingRoomChat() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  const resetChat = () => {
    setMessages([GREETING]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  };

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
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
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Không thể kết nối trợ lý tìm phòng.",
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content:
            typeof data?.reply === "string"
              ? data.reply
              : "Mình chưa hiểu rõ nhu cầu. Bạn cho biết thêm khu vực và mức giá nhé.",
          rooms: Array.isArray(data?.rooms) ? data.rooms : [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const showRoomsOnRoomsPage = (rooms: ChatRoom[], focusPostId?: string) => {
    const payload = buildChatResultsPayload(rooms, focusPostId);
    if (payload.postIds.length === 0) return;

    if (pathname === "/rooms") {
      window.dispatchEvent(new CustomEvent(CHAT_RESULTS_EVENT, { detail: payload }));
      return;
    }

    window.sessionStorage.setItem(CHAT_RESULTS_STORAGE_KEY, JSON.stringify(payload));
    router.push("/rooms");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[1200] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="Trợ lý tìm phòng"
          className="flex h-[min(680px,calc(100vh-112px))] w-[calc(100vw-40px)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-sky-100 bg-slate-50 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-slate-900">
                  AI tìm phòng
                </h2>
                <p className="truncate text-xs text-slate-500">
                  Hỏi nhu cầu, lọc phòng, mở chi tiết
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Xóa hội thoại"
                title="Xóa hội thoại"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Đóng chat"
                title="Đóng chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    message.role === "user"
                      ? "bg-sky-600 text-white"
                      : "bg-white text-sky-700 ring-1 ring-sky-100"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`min-w-0 max-w-[82%] space-y-2 ${message.role === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "rounded-tr-md bg-sky-600 font-medium text-white"
                        : "rounded-tl-md border border-sky-100 bg-white text-slate-800"
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.rooms?.length ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => showRoomsOnRoomsPage(message.rooms ?? [])}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
                      >
                        <MapPin className="h-4 w-4" />
                        Hiển thị các phòng này trên trang bản đồ
                      </button>
                      {message.rooms.map((room) => (
                        <RoomResult
                          key={room.post_id}
                          room={room}
                          canShowOnRoomsPage
                          onShowOnRoomsPage={showRoomsOnRoomsPage}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {messages.length === 1 ? (
              <div className="ml-10 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-left text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            {loading ? (
              <div className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 ring-1 ring-sky-100">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                  Đang tìm phòng phù hợp...
                </div>
              </div>
            ) : null}

            <div ref={listEndRef} />
          </div>

          {error ? (
            <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="border-t border-sky-100 bg-white p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
                placeholder="Nhập nhu cầu tìm phòng..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-sky-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Gửi tin nhắn"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Enter để gửi, Shift+Enter để xuống dòng
            </p>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex h-14 items-center gap-3 rounded-2xl bg-sky-600 px-4 text-white shadow-2xl shadow-sky-300 transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
        aria-expanded={open}
        aria-label={open ? "Đóng trợ lý tìm phòng" : "Mở trợ lý tìm phòng"}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden text-sm font-bold sm:inline">
          Chat tìm phòng
        </span>
      </button>
    </div>
  );
}
