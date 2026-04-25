"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InboxList from "@/components/chat/InboxList";

export default function ChatInboxPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("users")
        .select("user_role")
        .eq("user_id", user.id)
        .single();

      setUserRole(data?.user_role ?? null);
      setLoading(false);
    };

    void load();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">Đang tải inbox...</div>;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-bold text-slate-900">Bạn cần đăng nhập để xem inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_100%)] px-4 py-6 text-slate-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Trung tâm nhắn tin</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Hộp thư</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {userRole === "owner"
                  ? "Danh sách cuộc trò chuyện giữa bạn và người thuê, gồm cả mục đã lưu trữ và trạng thái tự xóa."
                  : "Danh sách cuộc trò chuyện giữa bạn và chủ nhà, gồm cả mục đã lưu trữ và trạng thái tự xóa."}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</p>
                <p className="text-sm font-semibold text-slate-900">Đang hoạt động</p>
              </div>
            </div>
          </div>
        </header>

        <InboxList currentUserId={userId} currentUserRole={userRole} />
      </div>
    </div>
  );
}
