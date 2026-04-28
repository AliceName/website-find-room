"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { REPORT_STATUS_LABELS, REPORT_STATUS_STYLES, ReportStatus } from "@/lib/services/report.service";
import { ReportAdminService } from "@/lib/services/report-admin.service";

type FilterStatus = ReportStatus | "all";

interface ReportListItem {
  report_id: string;
  post_id: string;
  reporter_user_id: string;
  reason_code: string;
  report_status: ReportStatus;
  report_created_at: string;
  post?: { post_title: string | null } | null;
  reporter?: { user_name: string | null; user_email: string | null } | null;
  assigned_user?: { user_name: string | null } | null;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = (searchParams.get("status") as FilterStatus) || "all";
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setUserId(user?.id ?? null);
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { data: profile } = await supabase.from("users").select("user_role").eq("user_id", user.id).single();
      setUserRole(profile?.user_role ?? null);
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    if (userRole && userRole !== "admin") {
      router.push("/");
      return;
    }
    void fetchReports();
  }, [userId, userRole, statusParam]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ReportAdminService.listReports({ status: statusParam });
      setReports(data as unknown as ReportListItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải report");
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((r) => r.report_status === "open").length;
    const reviewing = reports.filter((r) => r.report_status === "reviewing").length;
    const resolved = reports.filter((r) => r.report_status === "resolved").length;
    const rejected = reports.filter((r) => r.report_status === "rejected").length;
    return { total, open, reviewing, resolved, rejected };
  }, [reports]);

  const filterButton = (value: FilterStatus, label: string, count: number) => {
    const active = statusParam === value;
    return (
      <Link
        href={`/admin/reports?status=${value}`}
        className={`rounded-2xl border px-4 py-2 text-sm font-bold transition-all ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
      >
        {label} <span className="ml-1 opacity-80">({count})</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Admin moderation</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Quản lý report bài đăng</h1>
              <p className="mt-1 text-sm text-slate-500">Duyệt các báo cáo từ người dùng và cập nhật trạng thái xử lý.</p>
            </div>
            <button onClick={fetchReports} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">
              Làm mới
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterButton("all", "Tất cả", counts.total)}
          {filterButton("open", "Chờ xử lý", counts.open)}
          {filterButton("reviewing", "Đang xem xét", counts.reviewing)}
          {filterButton("resolved", "Đã xử lý", counts.resolved)}
          {filterButton("rejected", "Đã từ chối", counts.rejected)}
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-lg font-bold text-slate-900">Không có report nào</p>
              <p className="mt-1 text-sm text-slate-500">Hiện chưa có báo cáo phù hợp với bộ lọc này.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((report) => (
                <Link key={report.report_id} href={`/admin/reports/${report.report_id}`} className="block p-5 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${REPORT_STATUS_STYLES[report.report_status]}`}>{REPORT_STATUS_LABELS[report.report_status]}</span>
                        <span className="text-xs font-medium text-slate-400">#{report.report_id.slice(0, 8)}</span>
                      </div>
                      <h3 className="mt-2 truncate text-base font-bold text-slate-950">{report.post?.post_title || "Bài đăng đã bị xóa"}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Người báo cáo: <span className="font-medium text-slate-700">{report.reporter?.user_name || "—"}</span> · {report.reporter?.user_email || "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-slate-500 md:items-end">
                      <span>Đã báo cáo: {new Date(report.report_created_at).toLocaleString("vi-VN")}</span>
                      <span>Lý do chính: <span className="font-bold text-slate-700">{report.reason_code}</span></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
