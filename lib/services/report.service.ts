import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";

export type ReportReasonCode =
  | "fake_info"
  | "spam"
  | "duplicate"
  | "abuse"
  | "scam_suspected"
  | "other";

export type ReportStatus = "open" | "reviewing" | "resolved" | "rejected";
export type ReportActionType = "open" | "reviewing" | "resolved" | "rejected" | "note";

export type PostReportRow = Database["public"]["Tables"]["post_reports"]["Row"];
export type PostReportInsert = Database["public"]["Tables"]["post_reports"]["Insert"];
export type PostReportActionInsert = Database["public"]["Tables"]["post_report_actions"]["Insert"];

export const REPORT_REASON_LABELS: Record<ReportReasonCode, string> = {
  fake_info: "Tin giả / thông tin không đúng",
  spam: "Spam / đăng quá nhiều",
  duplicate: "Tin trùng lặp",
  abuse: "Ngôn từ xúc phạm / quấy rối",
  scam_suspected: "Nghi ngờ lừa đảo",
  other: "Lý do khác",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Đang chờ xử lý",
  reviewing: "Đang xem xét",
  resolved: "Đã xử lý",
  rejected: "Đã từ chối",
};

export const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export type ReportWithRelations = PostReportRow & {
  post?: { post_title: string; room_id: string | null; user_id: string | null } | null;
  reporter?: { user_id: string; user_name: string; user_email: string; user_phone: string | null } | null;
  assigned_user?: { user_id: string; user_name: string; user_email: string; user_phone: string | null } | null;
};

export type ReportActionRow = Database["public"]["Tables"]["post_report_actions"]["Row"];

export class ReportService {
  static async getMyReportForPost(postId: string, userId: string): Promise<PostReportRow | null> {
    const { data, error } = await supabase
      .from("post_reports")
      .select("*")
      .eq("post_id", postId)
      .eq("reporter_user_id", userId)
      .order("report_created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Không thể tải báo cáo: ${error.message}`);
    }

    return data ?? null;
  }

  static async createReport(input: {
    postId: string;
    reporterUserId: string;
    reasonCodes: ReportReasonCode[];
    reasonDetail?: string;
  }): Promise<{ report: PostReportRow; isDuplicate: boolean }> {
    const { postId, reporterUserId, reasonCodes, reasonDetail } = input;
    const uniqueReasons = Array.from(new Set(reasonCodes)).filter(Boolean) as ReportReasonCode[];

    if (uniqueReasons.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một lý do báo cáo.");
    }

    const existing = await this.getMyReportForPost(postId, reporterUserId);
    if (existing && ["open", "reviewing"].includes(existing.report_status)) {
      return { report: existing, isDuplicate: true };
    }

    const primaryReason = uniqueReasons[0];
    const selectedLabels = uniqueReasons.map((code) => REPORT_REASON_LABELS[code]).join(", ");
    const detailParts = [
      `Lý do báo cáo: ${selectedLabels}`,
      reasonDetail?.trim() ? `Chi tiết: ${reasonDetail.trim()}` : null,
    ].filter(Boolean);

    const payload: PostReportInsert = {
      post_id: postId,
      reporter_user_id: reporterUserId,
      reason_code: primaryReason,
      reason_detail: detailParts.join("\n"),
      report_status: "open",
    };

    const { data, error } = await supabase
      .from("post_reports")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Không thể gửi báo cáo: ${error.message}`);
    }

    const actionPayload: PostReportActionInsert = {
      report_id: data.report_id,
      actor_user_id: reporterUserId,
      action_type: "open",
      action_note: selectedLabels,
    };

    const { error: actionError } = await supabase.from("post_report_actions").insert(actionPayload);

    if (actionError) {
      throw new Error(`Đã tạo báo cáo nhưng không thể ghi lịch sử: ${actionError.message}`);
    }

    return { report: data, isDuplicate: false };
  }
}
