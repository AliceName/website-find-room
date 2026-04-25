"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";
import { ChatService } from "@/lib/services/chat.service";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type ConversationItem = ConversationRow & {
  renter: { user_name: string; user_avatar: string | null } | null;
  owner: { user_name: string; user_avatar: string | null } | null;
  posts: { post_title: string } | null;
  rooms: { room_description: string | null } | null;
  unread_count: number;
  user_state?: 'hidden' | 'deleted' | null;
};

interface InboxListProps {
  currentUserId: string;
  currentUserRole?: string | null;
}

export default function InboxList({ currentUserId, currentUserRole }: InboxListProps) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const baseQuery = supabase
      .from("conversations")
      .select(`
        *,
        renter:users!conversations_renter_id_fkey ( user_name, user_avatar ),
        owner:users!conversations_owner_id_fkey ( user_name, user_avatar ),
        posts:posts!conversations_post_id_fkey ( post_title ),
        rooms:rooms!conversations_room_id_fkey ( room_description )
      `)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    const { data, error } = currentUserRole === "owner"
      ? await baseQuery.eq("owner_id", currentUserId)
      : await baseQuery.eq("renter_id", currentUserId);

    if (error || !data || data.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: stateRows } = await supabase
      .from("conversation_user_states")
      .select("conversation_id, state")
      .eq("user_id", currentUserId)
      .in("conversation_id", data.map((item) => item.conversation_id));

    const stateByConversation = (stateRows || []).reduce<Record<string, 'hidden' | 'deleted'>>((acc, row) => {
      acc[row.conversation_id] = row.state as 'hidden' | 'deleted';
      return acc;
    }, {});

    const conversationIds = data.map((item) => item.conversation_id).filter((id) => stateByConversation[id] !== 'hidden' && stateByConversation[id] !== 'deleted');
    const { data: messageRows } = await supabase
      .from("messages")
      .select("conversation_id, sender_user_id, is_read, deleted_at")
      .in("conversation_id", conversationIds)
      .is("deleted_at", null)
      .neq("sender_user_id", currentUserId);

    const unreadByConversation = (messageRows || []).reduce<Record<string, number>>((acc, message) => {
      if (!message.is_read) {
        acc[message.conversation_id] = (acc[message.conversation_id] || 0) + 1;
      }
      return acc;
    }, {});

    setItems(
      (data || []).map((conversation) => ({
        ...(conversation as ConversationItem),
        unread_count: unreadByConversation[conversation.conversation_id] || 0,
        user_state: stateByConversation[conversation.conversation_id] || null,
      })),
    );
    setLoading(false);
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    void load();

    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", refresh);
    window.addEventListener("chat:updated", refresh as EventListener);

    const channel = supabase
      .channel(`inbox:${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, refresh)
      .subscribe();

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("chat:updated", refresh as EventListener);
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, load]);

  const archivedItems = items.filter((conversation) => {
    const state = conversation.user_state;
    return state === "hidden" || state === "deleted";
  });

  const primaryItems = items.filter((conversation) => {
    const state = conversation.user_state;
    return state !== "hidden" && state !== "deleted";
  });

  const visibleItems = showArchived ? archivedItems : primaryItems;

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Đang tải inbox...</div>;
  }

  const archivedCount = archivedItems.length;
  const emptyMessage = showArchived
    ? "Chưa có cuộc trò chuyện lưu trữ nào."
    : archivedCount > 0
      ? "Có cuộc trò chuyện đang được lưu trữ. Bấm vào tab Lưu trữ để xem."
      : "Chưa có cuộc trò chuyện nào.";

  if (visibleItems.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                !showArchived ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Hộp thư chính
            </button>
            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                showArchived ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Lưu trữ
              {archivedCount > 0 && (
                <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">
                  {archivedCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setShowArchived(false)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              !showArchived ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Hộp thư chính
          </button>
          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              showArchived ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Lưu trữ
            {archivedCount > 0 && (
              <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">
                {archivedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {visibleItems.map((conversation) => {
        const otherUser = currentUserId === conversation.owner_id ? conversation.renter : conversation.owner;
        const title = conversation.posts?.post_title || conversation.rooms?.room_description || "Chưa gắn bài đăng";

        const isHidden = conversation.user_state === "hidden";
        const isDeleted = conversation.user_state === "deleted";
        const isArchived = isHidden || isDeleted;

        if (!showArchived && isArchived) {
          return null;
        }

        return (
          <div key={conversation.conversation_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <Link href={`/chat/${conversation.conversation_id}`} className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{otherUser?.user_name || "Người dùng"}</p>
                <p className="mt-1 text-sm text-slate-500">{title}</p>
                {conversation.unread_count > 0 && (
                  <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                    {conversation.unread_count} chưa đọc
                  </span>
                )}
                {isHidden && (
                  <span className="mt-2 ml-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    Đã lưu trữ
                  </span>
                )}
                {isDeleted && (
                  <span className="mt-2 ml-2 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                    Đã xóa khỏi máy của bạn
                  </span>
                )}
              </Link>
              <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-400">
                <div>{conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString("vi-VN") : "Chưa có tin nhắn"}</div>
                {isArchived && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await ChatService.removeConversationState(conversation.conversation_id, currentUserId);
                        await load();
                      } catch (error) {
                        alert(error instanceof Error ? error.message : "Không thể hiện lại cuộc trò chuyện");
                      }
                    }}
                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Hiện lại
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
