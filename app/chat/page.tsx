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
    return (
      <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center">
        <div className="text-slate-500">Đang tải hộp thư...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center px-4">
        <div className="mx-auto max-w-md rounded-3xl border border-sky-100 bg-white p-10 text-center shadow-xl">
          <p className="text-lg font-bold text-slate-900">Bạn cần đăng nhập để xem hộp thư.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F0F9FF] text-slate-800 overflow-hidden">
      {/* Background Pattern + Glows */}
      <div className="fixed inset-0 -z-10">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Soft Glow Orbs */}
        <div className="absolute left-[-180px] top-[-120px] h-[520px] w-[520px] rounded-full bg-[#7DD3FC]/50 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-160px] h-[480px] w-[480px] rounded-full bg-[#0EA5E9]/30 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 overflow-hidden rounded-[28px] border border-sky-100 bg-white p-8 shadow-xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#0EA5E9]">
                💬 TRUNG TÂM NHẮN TIN
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Hộp thư</h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                {userRole === "owner"
                  ? "Quản lý tin nhắn với người thuê phòng của bạn."
                  : "Quản lý tin nhắn với chủ nhà / chủ trọ."}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-3">
              <div className="h-3 w-3 rounded-full bg-[#0EA5E9] animate-pulse" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</p>
                <p className="text-sm font-semibold text-[#0EA5E9]">Đang hoạt động</p>
              </div>
            </div>
          </div>
        </header>

        <InboxList currentUserId={userId} currentUserRole={userRole} />
      </div>
    </div>
  );
}