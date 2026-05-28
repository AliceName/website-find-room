"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  BAN_APPEAL_STATUS_LABELS,
  BAN_APPEAL_STATUS_STYLES,
  BanAppealService,
  BanAppealStatus,
  BanAppealWithUser,
} from "@/lib/services/ban-appeal.service";

type FilterStatus = BanAppealStatus | "all";

function AdminBansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = (searchParams.get("status") as FilterStatus) || "pending";
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [appeals, setAppeals] = useState<BanAppealWithUser[]>([]);
  const [noteByAppeal, setNoteByAppeal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setAdminUserId(user?.id ?? null);
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { data: profile } = await supabase.from("users").select("user_role").eq("user_id", user.id).single();
      setUserRole(profile?.user_role ?? null);
    });
  }, [router]);

  useEffect(() => {
    if (!adminUserId) return;
    if (userRole && userRole !== "admin") {
      router.push("/");
      return;
    }
    void fetchAppeals();
  }, [adminUserId, userRole, statusParam]);

  const fetchAppeals = async () => {
    setLoading(true);
    setError(null);
    try {
      setAppeals(await BanAppealService.listAppeals(statusParam));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải yêu cầu mở khóa.");
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    return {
      total: appeals.length,
      pending: appeals.filter((item) => item.status === "pending").length,
      approved: appeals.filter((item) => item.status === "approved").length,
      rejected: appeals.filter((item) => item.status === "rejected").length,
    };
  }, [appeals]);

  const updateNote = (appealId: string, note: string) => {
    setNoteByAppeal((current) => ({ ...current, [appealId]: note }));
  };

  const handleApprove = async (appeal: BanAppealWithUser) => {
    if (!adminUserId) return;
    setSavingId(appeal.appeal_id);
    setError(null);
    setSuccess(null);
    try {
      await BanAppealService.approveAppeal({
        appealId: appeal.appeal_id,
        userId: appeal.user_id,
        adminUserId,
        note: noteByAppeal[appeal.appeal_id],
        restorePosts: true,
      });
      setSuccess("Đã mở lại tài khoản và hiện lại bài đăng của người dùng.");
      await fetchAppeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể mở lại tài khoản.");
    } finally {
      setSavingId(null);
    }
  };

  const handleReject = async (appeal: BanAppealWithUser) => {
    if (!adminUserId) return;
    setSavingId(appeal.appeal_id);
    setError(null);
    setSuccess(null);
    try {
      await BanAppealService.rejectAppeal({
        appealId: appeal.appeal_id,
        adminUserId,
        note: noteByAppeal[appeal.appeal_id],
      });
      setSuccess("Đã từ chối yêu cầu mở khóa.");
      await fetchAppeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể từ chối yêu cầu.");
    } finally {
      setSavingId(null);
    }
  };

  const filterButton = (value: FilterStatus, label: string, count: number) => {
    const active = statusParam === value;
    return (
      <Link
        href={`/admin/bans?status=${value}`}
        className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
      >
        {label} <span className="ml-1 opacity-80">({count})</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Admin moderation</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Tài khoản bị khóa</h1>
              <p className="mt-1 text-sm text-slate-500">Xem yêu cầu mở khóa, mở lại tài khoản và hiện lại bài đăng cho người dùng.</p>
            </div>
            <button onClick={fetchAppeals} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">
              <RefreshCw size={16} /> Làm mới
            </button>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {filterButton("pending", "Chờ xử lý", counts.pending)}
          {filterButton("approved", "Đã mở lại", counts.approved)}
          {filterButton("rejected", "Đã từ chối", counts.rejected)}
          {filterButton("all", "Tất cả", counts.total)}
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
        {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{success}</div>}

        <div className="space-y-4">
          {loading ? (
            [...Array(4)].map((_, index) => <div key={index} className="h-44 animate-pulse rounded-[2rem] bg-white" />)
          ) : appeals.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-black">Không có yêu cầu phù hợp</p>
              <p className="mt-1 text-sm text-slate-500">Hiện chưa có yêu cầu mở khóa trong bộ lọc này.</p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <article key={appeal.appeal_id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${BAN_APPEAL_STATUS_STYLES[appeal.status]}`}>
                        {BAN_APPEAL_STATUS_LABELS[appeal.status]}
                      </span>
                      <span className="text-xs font-medium text-slate-400">#{appeal.appeal_id.slice(0, 8)}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-black">{appeal.user?.user_name || "Người dùng"}</h2>
                    <p className="mt-1 text-sm text-slate-500">{appeal.user?.user_email || appeal.contact_email}</p>
                    <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">{appeal.message}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <p><span className="font-bold text-slate-900">Lý do khóa:</span> {appeal.user?.ban_reason || "Không có"}</p>
                      <p><span className="font-bold text-slate-900">Ngày gửi:</span> {new Date(appeal.created_at).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>

                  <div className="w-full shrink-0 space-y-3 lg:w-80">
                    <textarea
                      value={noteByAppeal[appeal.appeal_id] ?? appeal.admin_note ?? ""}
                      onChange={(event) => updateNote(appeal.appeal_id, event.target.value)}
                      rows={4}
                      disabled={appeal.status !== "pending"}
                      placeholder="Ghi chú cho quyết định xử lý..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />
                    {appeal.status === "pending" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(appeal)}
                          disabled={savingId === appeal.appeal_id}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} /> Mở lại
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(appeal)}
                          disabled={savingId === appeal.appeal_id}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <XCircle size={16} /> Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminBansPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">Đang tải yêu cầu mở khóa...</div>}>
      <AdminBansContent />
    </Suspense>
  );
}
