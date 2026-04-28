"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { supabase } from "@/lib/supabaseClient";
import {
  PostReportSummary,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_STYLES,
  ReportReasonCode,
  ReportService,
} from "@/lib/services/report.service";

interface ReportButtonProps {
  postId?: string;
  postTitle?: string;
}

const REASON_OPTIONS: Array<{ id: ReportReasonCode; label: string; helper: string }> = [
  { id: "fake_info", label: "Tin giả / sai thông tin", helper: "Thông tin không đúng thực tế hoặc gây hiểu nhầm." },
  { id: "spam", label: "Spam / đăng lặp lại", helper: "Nội dung rác, spam, hoặc đăng quá nhiều lần." },
  { id: "duplicate", label: "Tin trùng lặp", helper: "Bài đăng đã tồn tại hoặc trùng với tin khác." },
  { id: "abuse", label: "Xúc phạm / lạm dụng", helper: "Ngôn từ thù ghét, quấy rối, hoặc nội dung không phù hợp." },
  { id: "scam_suspected", label: "Nghi ngờ lừa đảo", helper: "Có dấu hiệu yêu cầu chuyển tiền, lừa đảo, mạo danh." },
  { id: "other", label: "Lý do khác", helper: "Lý do khác chưa có trong danh sách." },
];

function formatRelativeTime(iso?: string | null) {
  if (!iso) return "—";
  const time = new Date(iso).getTime();
  const diff = Date.now() - time;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function ReportButton({ postId, postTitle = "bài đăng này" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [report, setReport] = useState<PostReportSummary | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<ReportReasonCode[]>([]);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!open || !postId || !currentUserId) return;
    ReportService.getMyReportForPost({ postId, userId: currentUserId })
      .then(setReport)
      .catch((error) => setSubmitError(error instanceof Error ? error.message : "Không thể tải trạng thái báo cáo."));
  }, [currentUserId, open, postId]);

  const canSubmit = useMemo(() => selectedReasons.length > 0 && !loading, [selectedReasons, loading]);

  const toggleReason = (reason: ReportReasonCode) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason],
    );
  };

  const handleSubmit = async () => {
    if (!postId) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const created = await ReportService.submitReport({
        postId,
        reporterUserId: user.id,
        reasonCodes: selectedReasons,
        reasonDetail: detail,
      });

      setReport(created);
      setSelectedReasons([]);
      setDetail("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể gửi báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  const latestAction = report?.actions?.[0];

  return (
    <>
      <Button variant="ghost" size="md" onClick={() => setOpen(true)} title="Báo cáo tin" className="flex-1">
        🚩 Báo cáo tin
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Báo cáo ${postTitle}`} type="danger">
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            Chọn một hoặc nhiều lý do báo cáo để đội ngũ kiểm duyệt có thể xem xét chính xác hơn.
          </p>

          {report && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Trạng thái hiện tại</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{REPORT_STATUS_LABELS[report.report_status]}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${REPORT_STATUS_STYLES[report.report_status]}`}>
                  {report.report_status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  Lý do đã gửi: <span className="font-bold text-slate-900">{REPORT_REASON_LABELS[report.reason_code]}</span>
                </p>
                {report.reason_detail && (
                  <p className="whitespace-pre-line">
                    Ghi chú: <span className="font-medium text-slate-900">{report.reason_detail}</span>
                  </p>
                )}
                <p>
                  Cập nhật gần nhất: <span className="font-medium text-slate-900">{formatRelativeTime(report.report_updated_at)}</span>
                </p>
                {latestAction && (
                  <p>
                    Xử lý gần nhất: <span className="font-medium text-slate-900">{latestAction.action_type}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Lý do báo cáo</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {REASON_OPTIONS.map((option) => {
                const selected = selectedReasons.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleReason(option.id)}
                    className={`rounded-2xl border-2 p-4 text-left transition-all ${selected
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-black ${selected ? "border-red-500 bg-red-500 text-white" : "border-slate-300 text-transparent"}`}>
                        ✓
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{option.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{option.helper}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">
              Mô tả chi tiết
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Mô tả thêm bằng chứng, dấu hiệu bất thường, hoặc thông tin cần kiểm tra..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{detail.length}/1000</p>
          </div>

          {submitError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            Báo cáo sẽ được lưu để quản trị viên kiểm duyệt và theo dõi trạng thái xử lý.
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} className="flex-1">
              Đóng
            </Button>
            <Button variant="danger" size="md" onClick={handleSubmit} disabled={!canSubmit} isLoading={loading} className="flex-1">
              Gửi báo cáo
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
