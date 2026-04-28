import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export type RetentionPolicy = "manual" | "3_days" | "7_days" | "30_days" | "forever";
export type ConversationUserState = "hidden" | "deleted";

export class ChatService {
  private static getExpiresAt(policy: RetentionPolicy): string | null {

    const now = new Date();

    if (policy === "3_days") return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    if (policy === "7_days") return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (policy === "30_days") return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return null;
  }

  static async getOrCreateConversation(input: {
    renterId: string;
    ownerId: string;
    postId?: string | null;
    roomId?: string | null;
    retentionPolicy?: RetentionPolicy;
    conversationType?: "direct" | "system";
  }): Promise<ConversationRow> {
    const {
      renterId,
      ownerId,
      postId = null,
      roomId = null,
      retentionPolicy = "manual",
      conversationType = "direct",
    } = input;

    if (renterId === ownerId) {
      throw new Error("Bạn không thể nhắn tin với chính tài khoản của mình.");
    }

    let query = supabase
      .from("conversations")
      .select("*")
      .eq("renter_id", renterId)
      .eq("owner_id", ownerId);

    if (conversationType === "system") {
      query = query.is("post_id", null).is("room_id", null);
    }

    const { data: existing, error: existingError } = await query.maybeSingle();

    if (existingError) {
      throw new Error(`Không thể kiểm tra cuộc trò chuyện: ${existingError.message}`);
    }

    if (existing) {
      const expiresAt = existing.retention_policy === retentionPolicy ? existing.expires_at : this.getExpiresAt(retentionPolicy);
      const shouldUpdateContext = conversationType !== "system";
      const { data: updated, error: updateError } = await supabase
        .from("conversations")
        .update({
          post_id: shouldUpdateContext ? (postId ?? existing.post_id) : existing.post_id,
          room_id: shouldUpdateContext ? (roomId ?? existing.room_id) : existing.room_id,
          retention_policy: retentionPolicy,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("conversation_id", existing.conversation_id)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(`Không thể cập nhật cuộc trò chuyện: ${updateError.message}`);
      }

      return updated;
    }

    const payload: ConversationInsert = {
      renter_id: renterId,
      owner_id: ownerId,
      post_id: postId,
      room_id: roomId,
      retention_policy: retentionPolicy,
      expires_at: this.getExpiresAt(retentionPolicy),
      last_message_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("conversations")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Không thể tạo cuộc trò chuyện: ${error.message}`);
    }

    return data;
  }

  static async getConversationById(conversationId: string): Promise<ConversationRow | null> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("conversation_id", conversationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Không thể lấy cuộc trò chuyện: ${error.message}`);
    }

    return data;
  }

  static async getMessages(conversationId: string): Promise<MessageRow[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Không thể lấy tin nhắn: ${error.message}`);
    }

    return data || [];
  }

  static async sendMessage(input: {
    conversationId: string;
    senderUserId: string;
    messageContent: string;
    messageType?: "text" | "system";
  }): Promise<MessageRow> {
    const { conversationId, senderUserId, messageContent, messageType = "text" } = input;

    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_user_id: senderUserId,
        message_content: messageContent,
        message_type: messageType,
      })
      .select("*")
      .single();

    if (messageError) {
      throw new Error(`Không thể gửi tin nhắn: ${messageError.message}`);
    }

    const { error: conversationError } = await supabase
      .from("conversations")
      .update({
        last_message_at: message.created_at,
        updated_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId);

    if (conversationError) {
      throw new Error(`Không thể cập nhật cuộc trò chuyện: ${conversationError.message}`);
    }

    return message;
  }

  static async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .neq("sender_user_id", userId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Không thể đánh dấu đã đọc: ${error.message}`);
    }
  }

  static async upsertConversationState(input: {
    conversationId: string;
    userId: string;
    state: ConversationUserState;
  }): Promise<void> {
    const { conversationId, userId, state } = input;
    const { error } = await supabase
      .from("conversation_user_states")
      .upsert(
        {
          conversation_id: conversationId,
          user_id: userId,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "conversation_id,user_id" },
      );

    if (error) {
      throw new Error(`Không thể cập nhật trạng thái cuộc trò chuyện: ${error.message}`);
    }
  }

  static async removeConversationState(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("conversation_user_states")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Không thể xóa trạng thái cuộc trò chuyện: ${error.message}`);
    }
  }
}
