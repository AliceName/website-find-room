"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { supabase } from "@/lib/supabaseClient";
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_STYLES,
  ReportReasonCode,
  ReportService,
  ReportStatus,
} from "@/lib/services/report.service";

const REPORT_OPTIONS: { id: ReportReasonCode; label: string; description: string }[] = [
  { id: "fake_info", label: "Tin giả", description: "Thông tin phòng, giá, vị trí hoặc hình ảnh không đúng thực tế." },
  { id: "spam", label: "Spam", description: "Đăng lặp lại, nội dung rác hoặc quảng cáo không liên quan." },
  { id: "duplicate", label: "Tin trùng lặp", description: "Cùng một phòng được đăng nhiều bài khác nhau." },
  { id: "abuse", label: "Quấy rối / xúc phạm", description: "Ngôn từ gây khó chịu, xúc phạm hoặc nội dung không phù hợp." },
  { id: "scam_suspected", label: "Nghi lừa đảo", description: "Có dấu hiệu yêu cầu chuyển tiền, cung cấp thông tin bất thường." },
  { id: "other", label: "Lý do khác", description: "Trường hợp khác không nằm trong các lựa chọn bên trên." },
];

interface ReportPostButtonProps {
  postId: string;
  postTitle?: string;
}

export default function ReportPostButton({ postId, postTitle = "bài đăng này" }: ReportPostButtonProps) {
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<ReportReasonCode[]>([]);
  const [reasonDetail, setReasonDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [myReportStatus, setMyReportStatus] = useState<ReportStatus | null>(null);
  const [myReportLabel, setMyReportLabel] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setCurrentUserId(user?.id ?? null);

      if (user?.id) {
        const existing = await ReportService.getMyReportForPost(postId, user.id);
        if (existing) {
          setMyReportStatus(existing.report_status as ReportStatus);
          setMyReportLabel(REPORT_STATUS_LABELS[existing.report_status as ReportStatus]);
        }
      }
    });
  }, [postId]);

  const selectedLabelText = useMemo(
    () => selectedReasons.map((reason) => REPORT_REASON_LABELS[reason]).join(", "),
    [selectedReasons],
  );

  const toggleReason = (reason: ReportReasonCode) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason],
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const result = await ReportService.createReport({
        postId,
        reporterUserId: user.id,
        reasonCodes: selectedReasons,
        reasonDetail,
      });

      if (result.isDuplicate) {
        setMyReportStatus(result.report.report_status as ReportStatus);
        setMyReportLabel(REPORT_STATUS_LABELS[result.report.report_status as ReportStatus]);
        setFeedback({
          type: "info",
          message: "Bạn đã gửi báo cáo cho bài đăng này rồi. Báo cáo hiện tại vẫn đang được xử lý.",
        });
      } else {
        setMyReportStatus("open");
        setMyReportLabel(REPORT_STATUS_LABELS.open);
        setFeedback({
          type: "success",
          message: "Cảm ơn bạn. Báo cáo đã được gửi thành công và đang chờ xử lý.",
        });
      }

      setSelectedReasons([]);
      setReasonDetail("");
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể gửi báo cáo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = selectedReasons.length > 0 && !loading;

  return (
    <>
      <Button variant="ghost" size="md" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        🚩 Báo cáo tin
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Báo cáo ${postTitle}`}
        description="Chọn một hoặc nhiều lý do để đội ngũ quản trị xem xét bài đăng này."
        type="danger"
        confirmText="Gửi báo cáo"
        cancelText="Đóng"
        onConfirm={handleSubmit}
        isLoading={loading}
        confirmDisabled={!canSubmit}
        containerClassName="max-w-[520px]"
      >
        <div className="space-y-3">
          {myReportStatus && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${REPORT_STATUS_STYLES[myReportStatus] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
              Báo cáo của bạn đang ở trạng thái: <strong>{myReportLabel}</strong>
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : feedback.type === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-bold text-slate-900">Trạng thái hiện tại</p>
            <p className="mt-1">
              {myReportStatus
                ? `Báo cáo của bạn đang ở trạng thái: ${myReportLabel}`
                : "Bạn chưa gửi báo cáo nào cho bài đăng này."}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-gray-900">Chọn lý do báo cáo</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {REPORT_OPTIONS.map((option) => {
                const checked = selectedReasons.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleReason(option.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-all ${checked ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">{option.label}</p>
                        <p className="text-[11px] leading-snug text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">Có thể chọn nhiều lý do cùng lúc.</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-gray-900">Mô tả thêm</p>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Mô tả thêm các dấu hiệu bạn thấy bất thường..."
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{reasonDetail.length}/1000</p>
          </div>

          {selectedReasons.length > 0 && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <span className="font-bold">Đã chọn:</span> {selectedLabelText}
            </div>
          )}

        </div>
      </Modal>
    </>
  );
}
