import { supabase } from "@/lib/supabaseClient";
import { ChatService } from "@/lib/services/chat.service";
import { ReportActionRow, ReportStatus, ReportWithRelations } from "@/lib/services/report.service";

export type ReportSeverityLevel = 1 | 2 | 3;

export class ReportAdminService {
  private static getSeverityNote(severity: ReportSeverityLevel): string {
    const noteMap: Record<ReportSeverityLevel, string> = {
      1: "Mức 1 - Vi phạm nhẹ, yêu cầu chỉnh sửa thủ công",
      2: "Mức 2 - Vi phạm trung bình, ẩn bài khỏi công khai",
      3: "Mức 3 - Vi phạm nặng, ẩn bài ngay và xem xét khóa tài khoản",
    };

    return noteMap[severity];
  }

  static async listReports(filters?: { status?: ReportStatus | "all" }): Promise<ReportWithRelations[]> {
    let query = supabase
      .from("post_reports")
      .select(`
        *,
        post:post_id ( post_title, room_id, user_id ),
        reporter:reporter_user_id ( user_id, user_name, user_email, user_phone ),
        assigned_user:assigned_to ( user_id, user_name, user_email, user_phone )
      `)
      .order("report_created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("report_status", filters.status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Không thể tải danh sách report: ${error.message}`);
    }

    return (data ?? []) as unknown as ReportWithRelations[];
  }

  static async getReportById(reportId: string): Promise<ReportWithRelations | null> {
    const { data, error } = await supabase
      .from("post_reports")
      .select(`
        *,
        post:post_id ( post_title, room_id, user_id ),
        reporter:reporter_user_id ( user_id, user_name, user_email, user_phone ),
        assigned_user:assigned_to ( user_id, user_name, user_email, user_phone )
      `)
      .eq("report_id", reportId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Không thể tải report: ${error.message}`);
    }

    return data as unknown as ReportWithRelations;
  }

  static async getReportActions(reportId: string): Promise<ReportActionRow[]> {
    const { data, error } = await supabase
      .from("post_report_actions")
      .select("*")
      .eq("report_id", reportId)
      .order("action_created_at", { ascending: true });

    if (error) {
      throw new Error(`Không thể tải lịch sử xử lý: ${error.message}`);
    }

    return data ?? [];
  }

  static async addAction(input: {
    reportId: string;
    actorUserId: string;
    actionType: "open" | "reviewing" | "resolved" | "rejected" | "note";
    note?: string;
  }): Promise<void> {
    const { error } = await supabase.from("post_report_actions").insert({
      report_id: input.reportId,
      actor_user_id: input.actorUserId,
      action_type: input.actionType,
      action_note: input.note?.trim() || null,
    });

    if (error) {
      throw new Error(`Không thể ghi lịch sử xử lý: ${error.message}`);
    }
  }

  static async setReviewing(input: {
    reportId: string;
    actorUserId: string;
    note?: string;
    assignedTo?: string | null;
  }): Promise<void> {
    const updatePayload: Record<string, unknown> = {
      report_status: "reviewing",
      report_updated_at: new Date().toISOString(),
    };

    if (input.assignedTo !== undefined) updatePayload.assigned_to = input.assignedTo;

    const { error } = await supabase.from("post_reports").update(updatePayload).eq("report_id", input.reportId);
    if (error) throw new Error(`Không thể cập nhật report: ${error.message}`);

    await this.addAction({
      reportId: input.reportId,
      actorUserId: input.actorUserId,
      actionType: "reviewing",
      note: input.note || "Đã tiếp nhận và chuyển sang xem xét",
    });
  }

  static async resolveWithSeverity(input: {
    reportId: string;
    actorUserId: string;
    severity: ReportSeverityLevel;
    note?: string;
    assignedTo?: string | null;
    roomId?: string | null;
    postTitle?: string;
    ownerUserId?: string | null;
  }): Promise<void> {
    const severityNote = this.getSeverityNote(input.severity);
    const resolutionNote = [severityNote, input.note?.trim()].filter(Boolean).join("\n");

    const { data: reportRow, error: reportFetchError } = await supabase
      .from("post_reports")
      .select("report_id, post_id, reporter_user_id")
      .eq("report_id", input.reportId)
      .single();

    if (reportFetchError || !reportRow) {
      throw new Error(`Không thể tải report gốc: ${reportFetchError?.message || "Không tìm thấy report"}`);
    }

    const updatePayload: Record<string, unknown> = {
      report_status: "resolved",
      resolution_note: resolutionNote,
      report_updated_at: new Date().toISOString(),
    };

    if (input.assignedTo !== undefined) updatePayload.assigned_to = input.assignedTo;

    const { error: reportError } = await supabase.from("post_reports").update(updatePayload).eq("report_id", input.reportId);
    if (reportError) throw new Error(`Không thể cập nhật report: ${reportError.message}`);

    if (input.roomId) {
      const shouldHide = input.severity >= 2;
      const { error: roomError } = await supabase
        .from("rooms")
        .update({ is_hidden: shouldHide })
        .eq("room_id", input.roomId);

      if (roomError) throw new Error(`Đã xử lý report nhưng không thể cập nhật trạng thái ẩn bài: ${roomError.message}`);
    }

    if (input.severity === 1 && input.ownerUserId && input.postTitle) {
      const systemConversation = await ChatService.getOrCreateConversation({
        renterId: input.actorUserId,
        ownerId: input.ownerUserId,
        retentionPolicy: "forever",
        conversationType: "system",
      });

      await ChatService.sendMessage({
        conversationId: systemConversation.conversation_id,
        senderUserId: input.actorUserId,
        messageType: "system",
        messageContent: `[THÔNG BÁO HỆ THỐNG]\nBài đăng "${input.postTitle}" của bạn đã bị báo cáo ở mức 1. Vui lòng kiểm tra và chỉnh sửa nội dung.`,
      });
    }

    if (input.severity === 3 && input.ownerUserId) {
      const { error: banError } = await supabase
        .from("users")
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: input.note?.trim() || severityNote,
        })
        .eq("user_id", input.ownerUserId);

      if (banError) {
        throw new Error(`Đã xử lý report nhưng không thể khóa tài khoản: ${banError.message}`);
      }
    }

    await this.addAction({
      reportId: input.reportId,
      actorUserId: input.actorUserId,
      actionType: "resolved",
      note: resolutionNote,
    });
  }

  static async rejectReport(input: {
    reportId: string;
    actorUserId: string;
    note?: string;
    assignedTo?: string | null;
  }): Promise<void> {
    const updatePayload: Record<string, unknown> = {
      report_status: "rejected",
      report_updated_at: new Date().toISOString(),
    };

    if (input.assignedTo !== undefined) updatePayload.assigned_to = input.assignedTo;

    const { error } = await supabase.from("post_reports").update(updatePayload).eq("report_id", input.reportId);
    if (error) throw new Error(`Không thể cập nhật report: ${error.message}`);

    await this.addAction({
      reportId: input.reportId,
      actorUserId: input.actorUserId,
      actionType: "rejected",
      note: input.note?.trim() || "Report không đủ căn cứ xử lý",
    });
  }
}
