import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";

export type BanAppealStatus = "pending" | "approved" | "rejected";
export type BanAppealRow = Database["public"]["Tables"]["ban_appeals"]["Row"];
export type BanAppealInsert = Database["public"]["Tables"]["ban_appeals"]["Insert"];

export const BAN_APPEAL_STATUS_LABELS: Record<BanAppealStatus, string> = {
  pending: "Chờ admin xử lý",
  approved: "Đã mở lại",
  rejected: "Đã từ chối",
};

export const BAN_APPEAL_STATUS_STYLES: Record<BanAppealStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

export type BanAppealWithUser = BanAppealRow & {
  user?: {
    user_id: string;
    user_name: string | null;
    user_email: string | null;
    user_phone: string | null;
    is_banned: boolean | null;
    ban_reason: string | null;
    banned_at: string | null;
  } | null;
  reviewed_user?: {
    user_name: string | null;
    user_email: string | null;
  } | null;
};

export class BanAppealService {
  static async submitAppeal(input: {
    email: string;
    message: string;
  }): Promise<BanAppealRow> {
    const email = input.email.trim().toLowerCase();
    const message = input.message.trim();

    if (!email) throw new Error("Vui lòng nhập email tài khoản bị khóa.");
    if (message.length < 20) throw new Error("Vui lòng mô tả yêu cầu ít nhất 20 ký tự.");

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, is_banned")
      .eq("user_email", email)
      .maybeSingle();

    if (userError) throw new Error(`Không thể kiểm tra tài khoản: ${userError.message}`);
    if (!user) throw new Error("Không tìm thấy tài khoản với email này.");
    if (!user.is_banned) throw new Error("Tài khoản này hiện không bị khóa.");

    const { data: existing, error: existingError } = await supabase
      .from("ban_appeals")
      .select("*")
      .eq("user_id", user.user_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw new Error(`Không thể kiểm tra yêu cầu hiện có: ${existingError.message}`);
    if (existing) return existing as BanAppealRow;

    const payload: BanAppealInsert = {
      user_id: user.user_id,
      contact_email: email,
      message,
      status: "pending",
    };

    const { data, error } = await supabase.from("ban_appeals").insert(payload).select("*").single();
    if (error) throw new Error(`Không thể gửi yêu cầu mở khóa: ${error.message}`);

    return data as BanAppealRow;
  }

  static async listAppeals(status: BanAppealStatus | "all" = "pending"): Promise<BanAppealWithUser[]> {
    let query = supabase
      .from("ban_appeals")
      .select(`
        *,
        user:user_id ( user_id, user_name, user_email, user_phone, is_banned, ban_reason, banned_at ),
        reviewed_user:reviewed_by ( user_name, user_email )
      `)
      .order("created_at", { ascending: false });

    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw new Error(`Không thể tải yêu cầu mở khóa: ${error.message}`);

    return (data ?? []) as unknown as BanAppealWithUser[];
  }

  static async approveAppeal(input: {
    appealId: string;
    userId: string;
    adminUserId: string;
    note?: string;
    restorePosts?: boolean;
  }): Promise<void> {
    const now = new Date().toISOString();

    const { error: userError } = await supabase
      .from("users")
      .update({ is_banned: false, banned_at: null, ban_reason: null })
      .eq("user_id", input.userId);

    if (userError) throw new Error(`Không thể mở lại tài khoản: ${userError.message}`);

    if (input.restorePosts !== false) {
      const { error: roomError } = await supabase
        .from("rooms")
        .update({ is_hidden: false })
        .eq("owner_id", input.userId);

      if (roomError) throw new Error(`Đã mở tài khoản nhưng không thể hiện lại bài đăng: ${roomError.message}`);
    }

    const { error: appealError } = await supabase
      .from("ban_appeals")
      .update({
        status: "approved",
        admin_note: input.note?.trim() || null,
        reviewed_by: input.adminUserId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("appeal_id", input.appealId);

    if (appealError) throw new Error(`Không thể cập nhật yêu cầu: ${appealError.message}`);
  }

  static async rejectAppeal(input: {
    appealId: string;
    adminUserId: string;
    note?: string;
  }): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("ban_appeals")
      .update({
        status: "rejected",
        admin_note: input.note?.trim() || "Admin đã từ chối yêu cầu mở khóa.",
        reviewed_by: input.adminUserId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("appeal_id", input.appealId);

    if (error) throw new Error(`Không thể từ chối yêu cầu: ${error.message}`);
  }
}
