"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";
import ChatThread from "@/components/chat/ChatThread";
import { ChatService } from "@/lib/services/chat.service";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type ConversationDetail = ConversationRow & {
  renter: { user_name: string; user_avatar: string | null; user_email: string; user_phone: string | null } | null;
  owner: { user_name: string; user_avatar: string | null; user_email: string; user_phone: string | null } | null;
  posts: { post_title: string } | null;
  rooms: { room_description: string | null; room_price: number | null } | null;
};

function getAvatarText(name?: string | null) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ChatPage() {
  const params = useParams<{ conversation_id: string }>();
  const conversationId = params?.conversation_id;

  const [pageReady, setPageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteAfterDays, setDeleteAfterDays] = useState<1 | 3 | 7 | 30>(7);
  const [updatingRetention, setUpdatingRetention] = useState(false);
  const [deletingNow, setDeletingNow] = useState(false);
  const [userState, setUserState] = useState<"hidden" | "deleted" | null>(null);
  const [restoringState, setRestoringState] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!conversationId) return;

      setPageReady(false);
      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (mounted) setError("Vui lòng đăng nhập để xem cuộc trò chuyện.");
        setLoading(false);
        return;
      }

      setCurrentUserId(authData.user.id);

      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .select(`
          *,
          renter:users!conversations_renter_id_fkey ( user_name, user_avatar, user_email, user_phone ),
          owner:users!conversations_owner_id_fkey ( user_name, user_avatar, user_email, user_phone ),
          posts:posts!conversations_post_id_fkey ( post_title ),
          rooms:rooms!conversations_room_id_fkey ( room_description, room_price )
        `)
        .eq("conversation_id", conversationId)
        .single();

      if (conversationError || !conversationData) {
        if (mounted) setError("Không tìm thấy cuộc trò chuyện.");
        setLoading(false);
        return;
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (messagesError) {
        if (mounted) setError(messagesError.message);
        setLoading(false);
        return;
      }

      if (mounted) {
        const stateRow = await supabase
          .from("conversation_user_states")
          .select("state")
          .eq("conversation_id", conversationId)
          .eq("user_id", authData.user.id)
          .maybeSingle();

        setUserState((stateRow.data?.state as "hidden" | "deleted" | undefined) ?? null);
        setConversation(conversationData as unknown as ConversationDetail);
        setMessages((messagesData || []) as MessageRow[]);
      }

      try {
        await supabase
          .from("messages")
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversationId)
          .neq("sender_user_id", authData.user.id)
          .is("deleted_at", null);
      } catch {
        // ignore read-state update failure
      }

      if (mounted) {
        setLoading(false);
        requestAnimationFrame(() => setPageReady(true));
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [conversationId]);

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.is_read && message.sender_user_id !== currentUserId).length,
    [messages, currentUserId],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-44 rounded-[2.5rem] bg-slate-200/80" />
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[62vh] rounded-[2rem] bg-slate-200/70" />
            <div className="h-[62vh] rounded-[2rem] bg-slate-200/70" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !conversation || !currentUserId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-bold text-slate-900">{error || "Không thể mở cuộc trò chuyện."}</p>
        </div>
      </div>
    );
  }

  const isCurrentUserOwner = currentUserId === conversation.owner_id;
  const otherUser = isCurrentUserOwner ? conversation.renter : conversation.owner;
  const linkedTitle = conversation.posts?.post_title || conversation.rooms?.room_description || "Chưa gắn bài đăng";
  const roomPrice = conversation.rooms?.room_price
    ? conversation.rooms.room_price >= 1_000_000
      ? `${(conversation.rooms.room_price / 1_000_000).toFixed(1).replace(/\.0$/, "")} triệu/tháng`
      : `${conversation.rooms.room_price.toLocaleString("vi-VN")} đ/tháng`
    : "—";
  const roomAddress = conversation.rooms?.room_description || "—";
  const amenities = ["Ban ghế", "Chỗ để xe", "Cho nuôi thú cưng", "Cửa sổ thoáng"];
  const currentRetentionLabel =
    conversation.retention_policy === "manual"
      ? conversation.expires_at
        ? "1 ngày"
        : "Thủ công"
      : conversation.retention_policy === "3_days"
        ? "3 ngày"
        : conversation.retention_policy === "7_days"
          ? "7 ngày"
          : conversation.retention_policy === "30_days"
            ? "30 ngày"
            : "Thủ công";

  const userStateLabel = userState === "hidden" ? "Đang ẩn" : userState === "deleted" ? "Đã xóa khỏi máy" : null;

  return (
    <div
      className={`min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_100%)] px-4 py-6 text-slate-900 transition-all duration-700 ease-out md:px-8 md:py-8 ${
        pageReady ? "opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.08fr_1.1fr] xl:grid-cols-[0.78fr_1.05fr_1.17fr]">
            <section className="border-b border-slate-200/80 p-4 transition-all duration-500 ease-out hover:bg-slate-50/60 md:p-5 lg:border-b-0 lg:border-r lg:p-4 xl:p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Người đang nhắn</p>
              <div className="mt-4 flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-[15px] font-black text-white shadow-lg shadow-blue-200/70 ring-4 ring-blue-50">
                  {getAvatarText(otherUser?.user_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-[1.12rem] font-black tracking-tight text-slate-950 md:text-[1.18rem]">
                    {otherUser?.user_name || "Người dùng"}
                  </h1>
                  <div className="mt-1 space-y-0.5 text-[12px] text-slate-500">
                    <p className="truncate">{otherUser?.user_email || "—"}</p>
                    <p className="truncate">{otherUser?.user_phone || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.15rem] bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Trạng thái trao đổi</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                    {messages.length} tin nhắn
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-100">
                    {unreadCount} chưa đọc
                  </span>
                </div>
                {userStateLabel ? (
                  <div className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                    {userStateLabel}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="border-b border-slate-200/80 p-4 transition-all duration-500 ease-out hover:bg-slate-50/60 md:p-5 lg:border-b-0 lg:border-r lg:p-5 xl:p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Thông tin phòng trọ</p>
              <div className="mt-4 space-y-3.5">
                <div>
                  <p className="line-clamp-2 text-[1.15rem] font-black leading-snug text-slate-950 md:text-[1.25rem]">{linkedTitle}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">Phòng trọ</span>
                    <span className="font-semibold text-slate-700">{roomPrice}</span>
                  </div>
                </div>
                <p className="text-[13px] leading-6 text-slate-600">{roomAddress}</p>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
                {conversation.post_id ? (
                  <a href={`/rooms/${conversation.post_id}`} className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
                    Mở bài đăng
                  </a>
                ) : (
                  <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-500">
                    Chưa có bài đăng liên kết
                  </div>
                )}
              </div>
            </section>

            <section className="p-4 transition-all duration-500 ease-out hover:bg-slate-50/60 md:p-5 lg:p-6 xl:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Tùy chọn trò chuyện</p>
              <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-3 ring-1 ring-slate-100">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {userState ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!conversationId || restoringState || !currentUserId) return;
                        try {
                          setRestoringState(true);
                          await ChatService.removeConversationState(conversationId, currentUserId);
                          setUserState(null);
                          window.location.reload();
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Không thể hiện lại cuộc trò chuyện");
                        } finally {
                          setRestoringState(false);
                        }
                      }}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 lg:col-span-3"
                      disabled={restoringState}
                    >
                      {restoringState ? "Đang hiện lại..." : "Hiện lại"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!conversationId || deletingNow || !currentUserId) return;
                          const confirmed = window.confirm("Ẩn cuộc trò chuyện này khỏi hộp thư của bạn?");
                          if (!confirmed) return;

                          try {
                            setDeletingNow(true);
                            await ChatService.upsertConversationState({
                              conversationId,
                              userId: currentUserId,
                              state: "hidden",
                            });
                            window.location.href = "/chat";
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Không thể ẩn cuộc trò chuyện");
                          } finally {
                            setDeletingNow(false);
                          }
                        }}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingNow}
                      >
                        {deletingNow ? "Đang ẩn..." : "Ẩn cuộc trò chuyện"}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!conversationId || deletingNow || !currentUserId) return;
                          const confirmed = window.confirm("Xóa khỏi máy của bạn? Đối phương vẫn thấy cuộc trò chuyện bình thường.");
                          if (!confirmed) return;

                          try {
                            setDeletingNow(true);
                            await ChatService.upsertConversationState({
                              conversationId,
                              userId: currentUserId,
                              state: "deleted",
                            });
                            window.location.href = "/chat";
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Không thể xóa khỏi máy của bạn");
                          } finally {
                            setDeletingNow(false);
                          }
                        }}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingNow}
                      >
                        {deletingNow ? "Đang xử lý..." : "Xóa khỏi máy của tôi"}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (!conversationId) return;
                      const confirmed = window.confirm(`Đặt tự động xóa cuộc trò chuyện sau ${deleteAfterDays} ngày?`);
                      if (!confirmed) return;

                      try {
                        setUpdatingRetention(true);
                        const policyMap = { 1: "manual", 3: "3_days", 7: "7_days", 30: "30_days" } as const;
                        const expiresAt = new Date(Date.now() + deleteAfterDays * 24 * 60 * 60 * 1000).toISOString();
                        const retentionPolicy = policyMap[deleteAfterDays];
                        const { error: retentionError } = await supabase
                          .from("conversations")
                          .update({
                            retention_policy: retentionPolicy,
                            expires_at: expiresAt,
                            updated_at: new Date().toISOString(),
                          })
                          .eq("conversation_id", conversationId);

                        if (retentionError) throw new Error(retentionError.message);

                        setConversation((current) =>
                          current
                            ? {
                                ...current,
                                retention_policy: retentionPolicy,
                                expires_at: expiresAt,
                              }
                            : current,
                        );
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Không thể cập nhật chế độ tự xóa");
                      } finally {
                        setUpdatingRetention(false);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-3.5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={updatingRetention}
                  >
                    {updatingRetention ? "Đang cập nhật..." : `Tự xóa sau ${deleteAfterDays} ngày`}
                  </button>
                </div>

                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Chọn mốc tự xóa</span>
                  <select
                    value={deleteAfterDays}
                    onChange={(event) => setDeleteAfterDays(Number(event.target.value) as 1 | 3 | 7 | 30)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400"
                    disabled={updatingRetention}
                  >
                    <option value={1}>1 ngày</option>
                    <option value={3}>3 ngày</option>
                    <option value={7}>7 ngày</option>
                    <option value={30}>30 ngày</option>
                  </select>
                </label>

                <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-600 shadow-sm">
                  Trạng thái hiện tại: <span className="font-bold text-slate-900">{currentRetentionLabel}</span>
                  {userStateLabel ? <span className="ml-2 font-bold text-slate-900">• {userStateLabel}</span> : null}
                </div>
              </div>
            </section>
          </div>
        </header>

        <ChatThread
          conversationId={conversationId}
          currentUserId={currentUserId}
          initialMessages={messages}
          onMessagesRead={() => {
            window.dispatchEvent(new Event("chat:updated"));
          }}
        />
      </div>
    </div>
  );
}
