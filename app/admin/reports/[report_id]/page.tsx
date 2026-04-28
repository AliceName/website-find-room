"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_STYLES, ReportStatus } from "@/lib/services/report.service";
import { ReportAdminService, ReportSeverityLevel } from "@/lib/services/report-admin.service";

interface ReportDetail {
  report_id: string;
  post_id: string;
  reporter_user_id: string;
  reason_code: string;
  reason_detail: string | null;
  report_status: ReportStatus;
  assigned_to: string | null;
  resolution_note: string | null;
  report_created_at: string;
  report_updated_at: string;
  post?: { post_title: string | null; room_id: string | null; user_id: string | null } | null;
  reporter?: { user_name: string | null; user_email: string | null; user_phone: string | null } | null;
  assigned_user?: { user_name: string | null; user_email: string | null; user_phone: string | null } | null;
}

interface ReportAction {
  action_id: string;
  report_id: string;
  actor_user_id: string;
  action_type: string;
  action_note: string | null;
  action_created_at: string;
}

const SEVERITY_OPTIONS: { value: ReportSeverityLevel; label: string; description: string }[] = [
  { value: 1, label: "Mức 1 - Vi phạm nhẹ", description: "Giữ bài đăng, chỉ resolve report và yêu cầu chỉnh sửa thủ công." },
  { value: 2, label: "Mức 2 - Vi phạm trung bình", description: "Ẩn bài khỏi công khai bằng cách set rooms.is_hidden = true." },
  { value: 3, label: "Mức 3 - Vi phạm nặng", description: "Ẩn bài ngay và xem xét khóa tài khoản chủ tin." },
];

export default function AdminReportDetailPage({ params }: { params: Promise<{ report_id: string }> }) {
  const router = useRouter();
  const [reportId, setReportId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [actions, setActions] = useState<ReportAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [severity, setSeverity] = useState<ReportSeverityLevel>(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ report_id }) => setReportId(report_id));
  }, [params]);

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
    if (!reportId || !userId) return;
    if (userRole && userRole !== "admin") {
      router.push("/");
      return;
    }
    void fetchDetail();
  }, [reportId, userId, userRole]);

  const fetchDetail = async () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await ReportAdminService.getReportById(reportId);
      if (!detail) {
        setError("Không tìm thấy report.");
        return;
      }
      setReport(detail as unknown as ReportDetail);
      setActions((await ReportAdminService.getReportActions(reportId)) as unknown as ReportAction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết report");
    } finally {
      setLoading(false);
    }
  };

  const selectedReasonLabel = useMemo(() => {
    if (!report) return "—";
    return REPORT_REASON_LABELS[report.reason_code as keyof typeof REPORT_REASON_LABELS] || report.reason_code;
  }, [report]);

  const handleSetReviewing = async () => {
    if (!reportId || !userId) return;
    try {
      setSaving(true);
      setError(null);
      await ReportAdminService.setReviewing({
        reportId,
        actorUserId: userId,
        note,
        assignedTo: userId,
      });
      setSuccess("Đã chuyển report sang trạng thái xem xét.");
      setNote("");
      await fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật report");
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!reportId || !userId) return;
    try {
      setSaving(true);
      setError(null);
      await ReportAdminService.resolveWithSeverity({
        reportId,
        actorUserId: userId,
        severity,
        note,
        assignedTo: userId,
        roomId: report?.post?.room_id ?? null,
        postTitle: report?.post?.post_title ?? undefined,
        ownerUserId: report?.post?.user_id ?? null,
      });
      setSuccess("Đã xử lý report và cập nhật bài đăng theo mức đã chọn.");
      setNote("");
      await fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xử lý report");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!reportId || !userId) return;
    try {
      setSaving(true);
      setError(null);
      await ReportAdminService.rejectReport({
        reportId,
        actorUserId: userId,
        note,
        assignedTo: userId,
      });
      setSuccess("Đã từ chối report.");
      setNote("");
      await fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể từ chối report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-900">Đang tải...</div>;
  }

  if (!report) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-900">Không tìm thấy report.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/admin/reports" className="text-sm font-bold text-blue-600 hover:text-blue-700">← Quay lại danh sách report</Link>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${REPORT_STATUS_STYLES[report.report_status]}`}>{REPORT_STATUS_LABELS[report.report_status]}</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight">Chi tiết report</h1>
              <p className="mt-2 text-sm text-slate-500">Bài đăng: <span className="font-semibold text-slate-700">{report.post?.post_title || "Đã bị xóa"}</span></p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-bold text-slate-900">Lý do chính</p>
              <p className="mt-1">{selectedReasonLabel}</p>
            </div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
        {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{success}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Thông tin report</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-bold text-slate-900">Người báo cáo:</span> {report.reporter?.user_name || "—"} ({report.reporter?.user_email || "—"})</p>
                <p><span className="font-bold text-slate-900">Ngày tạo:</span> {new Date(report.report_created_at).toLocaleString("vi-VN")}</p>
                <p><span className="font-bold text-slate-900">Cập nhật:</span> {new Date(report.report_updated_at).toLocaleString("vi-VN")}</p>
                <p><span className="font-bold text-slate-900">Assigned to:</span> {report.assigned_user?.user_name || "Chưa phân công"}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Nội dung báo cáo</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div>
                  <p className="font-bold text-slate-900">Lý do báo cáo</p>
                  <p className="mt-1">{selectedReasonLabel}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Chi tiết người dùng</p>
                  <p className="mt-1 whitespace-pre-line rounded-2xl bg-slate-50 p-4">{report.reason_detail || "Không có"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Kết luận</p>
                  <p className="mt-1 whitespace-pre-line rounded-2xl bg-slate-50 p-4">{report.resolution_note || "Chưa có kết luận"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Lịch sử xử lý</h2>
              <div className="mt-4 space-y-3">
                {actions.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có action nào.</p>
                ) : actions.map((action) => (
                  <div key={action.action_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-900">{action.action_type}</span>
                      <span className="text-xs text-slate-400">{new Date(action.action_created_at).toLocaleString("vi-VN")}</span>
                    </div>
                    {action.action_note && <p className="mt-2 whitespace-pre-line text-slate-600">{action.action_note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Xử lý report</h2>
              <div className="mt-4 space-y-4">
                <button
                  type="button"
                  onClick={handleSetReviewing}
                  disabled={saving}
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                >
                  Đánh dấu đang xem xét
                </button>

                <label className="block text-sm font-bold text-slate-700">
                  Mức xử lý
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value) as ReportSeverityLevel)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    {SEVERITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                  {SEVERITY_OPTIONS.find((option) => option.value === severity)?.description}
                </p>

                <label className="block text-sm font-bold text-slate-700">
                  Ghi chú / kết luận
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    placeholder="Nhập ghi chú xử lý, lý do từ chối hoặc kết luận..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={saving}
                    className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Đang lưu..." : "Xử lý xong"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={saving}
                    className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                  >
                    Từ chối report
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
