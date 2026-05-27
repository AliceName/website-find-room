export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      amenities: {
        Row: {
          amenity_id: string
          amenity_name: string
        }
        Insert: {
          amenity_id?: string
          amenity_name: string
        }
        Update: {
          amenity_id?: string
          amenity_name?: string
        }
      }
      conversations: {
        Row: {
          conversation_id: string
          renter_id: string
          owner_id: string
          post_id: string | null
          room_id: string | null
          retention_policy: "manual" | "3_days" | "7_days" | "30_days" | "forever"
          expires_at: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string
          renter_id: string
          owner_id: string
          post_id?: string | null
          room_id?: string | null
          retention_policy?: "manual" | "3_days" | "7_days" | "30_days" | "forever"
          expires_at?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string
          renter_id?: string
          owner_id?: string
          post_id?: string | null
          room_id?: string | null
          retention_policy?: "manual" | "3_days" | "7_days" | "30_days" | "forever"
          expires_at?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      conversation_user_states: {
        Row: {
          conversation_id: string
          user_id: string
          state: "hidden" | "deleted"
          created_at: string
          updated_at: string | null
        }
        Insert: {
          conversation_id: string
          user_id: string
          state: "hidden" | "deleted"
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string
          user_id?: string
          state?: "hidden" | "deleted"
          created_at?: string
          updated_at?: string | null
        }
      }
      favorites: {
        Row: {
          favority_id: string
          user_id: string | null
          post_id: string | null
          favority_created_at: string | null
        }
        Insert: {
          favority_id?: string
          user_id?: string | null
          post_id?: string | null
          favority_created_at?: string | null
        }
        Update: {
          favority_id?: string
          user_id?: string | null
          post_id?: string | null
          favority_created_at?: string | null
        }
      }
      locations: {
        Row: {
          location_id: string
          city: string
          district: string | null
          ward: string | null
        }
        Insert: {
          location_id?: string
          city: string
          district?: string | null
          ward?: string | null
        }
        Update: {
          location_id?: string
          city?: string
          district?: string | null
          ward?: string | null
        }
      }
      messages: {
        Row: {
          message_id: string
          conversation_id: string
          sender_user_id: string
          message_content: string
          message_type: "text" | "system"
          is_read: boolean
          read_at: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          message_id?: string
          conversation_id: string
          sender_user_id: string
          message_content: string
          message_type?: "text" | "system"
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          message_id?: string
          conversation_id?: string
          sender_user_id?: string
          message_content?: string
          message_type?: "text" | "system"
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          deleted_at?: string | null
        }
      }
      posts: {
        Row: {
          post_id: string
          room_id: string | null
          post_title: string
          user_id: string | null
          post_created_at: string | null
          post_update_at: string | null
          post_expired_at: string | null
          view_count: number | null
        }
        Insert: {
          post_id?: string
          room_id?: string | null
          post_title: string
          user_id?: string | null
          post_created_at?: string | null
          post_update_at?: string | null
          post_expired_at?: string | null
          view_count?: number | null
        }
        Update: {
          post_id?: string
          room_id?: string | null
          post_title?: string
          user_id?: string | null
          post_created_at?: string | null
          post_update_at?: string | null
          post_expired_at?: string | null
          view_count?: number | null
        }
      }
      post_reports: {
        Row: {
          report_id: string
          post_id: string
          reporter_user_id: string
          reason_code: "fake_info" | "spam" | "duplicate" | "abuse" | "scam_suspected" | "other"
          reason_detail: string | null
          report_status: "open" | "reviewing" | "resolved" | "rejected"
          assigned_to: string | null
          resolution_note: string | null
          report_created_at: string | null
          report_updated_at: string | null
        }
        Insert: {
          report_id?: string
          post_id: string
          reporter_user_id: string
          reason_code: "fake_info" | "spam" | "duplicate" | "abuse" | "scam_suspected" | "other"
          reason_detail?: string | null
          report_status?: "open" | "reviewing" | "resolved" | "rejected"
          assigned_to?: string | null
          resolution_note?: string | null
          report_created_at?: string | null
          report_updated_at?: string | null
        }
        Update: {
          report_id?: string
          post_id?: string
          reporter_user_id?: string
          reason_code?: "fake_info" | "spam" | "duplicate" | "abuse" | "scam_suspected" | "other"
          reason_detail?: string | null
          report_status?: "open" | "reviewing" | "resolved" | "rejected"
          assigned_to?: string | null
          resolution_note?: string | null
          report_created_at?: string | null
          report_updated_at?: string | null
        }
      }
      post_report_actions: {
        Row: {
          action_id: string
          report_id: string
          actor_user_id: string | null
          action_type: "open" | "reviewing" | "resolved" | "rejected" | "note"
          action_note: string | null
          action_created_at: string | null
        }
        Insert: {
          action_id?: string
          report_id: string
          actor_user_id?: string | null
          action_type: "open" | "reviewing" | "resolved" | "rejected" | "note"
          action_note?: string | null
          action_created_at?: string | null
        }
        Update: {
          action_id?: string
          report_id?: string
          actor_user_id?: string | null
          action_type?: "open" | "reviewing" | "resolved" | "rejected" | "note"
          action_note?: string | null
          action_created_at?: string | null
        }
      }
      reviews: {
        Row: {
          review_id: string
          user_id: string | null
          room_id: string | null
          rating: number | null
          comment: string | null
          review_created_at: string | null
          review_updated_at: string | null
        }
        Insert: {
          review_id?: string
          user_id?: string | null
          room_id?: string | null
          rating?: number | null
          comment?: string | null
          review_created_at?: string | null
          review_updated_at?: string | null
        }
        Update: {
          review_id?: string
          user_id?: string | null
          room_id?: string | null
          rating?: number | null
          comment?: string | null
          review_created_at?: string | null
          review_updated_at?: string | null
        }
      }
      roomamenities: {
        Row: {
          room_amenities_id: string
          room_id: string | null
          amenity_id: string | null
        }
        Insert: {
          room_amenities_id?: string
          room_id?: string | null
          amenity_id?: string | null
        }
        Update: {
          room_amenities_id?: string
          room_id?: string | null
          amenity_id?: string | null
        }
      }
      roomimages: {
        Row: {
          image_id: string
          room_id: string | null
          image_url: string
          is_360: boolean | null
        }
        Insert: {
          image_id?: string
          room_id?: string | null
          image_url: string
          is_360?: boolean | null
        }
        Update: {
          image_id?: string
          room_id?: string | null
          image_url?: string
          is_360?: boolean | null
        }
      }
      rooms: {
        Row: {
          room_id: string
          room_description: string | null
          room_price: number
          room_area: number | null
          location_id: string | null
          latitude: number | null
          longitude: number | null
          owner_id: string | null
          room_status: boolean | null
          room_type_id: string | null
          room_created_at: string | null
          vr_url: string | null
          address_detail: string | null
          full_address: string | null
          is_hidden: boolean | null
        }
        Insert: {
          room_id?: string
          room_description?: string | null
          room_price: number
          room_area?: number | null
          location_id?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          room_status?: boolean | null
          room_type_id?: string | null
          room_created_at?: string | null
          vr_url?: string | null
          address_detail?: string | null
          full_address?: string | null
          is_hidden?: boolean | null
        }
        Update: {
          room_id?: string
          room_description?: string | null
          room_price?: number
          room_area?: number | null
          location_id?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          room_status?: boolean | null
          room_type_id?: string | null
          room_created_at?: string | null
          vr_url?: string | null
          address_detail?: string | null
          full_address?: string | null
          is_hidden?: boolean | null
        }
      }
      roomtypes: {
        Row: {
          room_type_id: string
          room_type_name: string
          room_type_description: string | null
        }
        Insert: {
          room_type_id?: string
          room_type_name: string
          room_type_description?: string | null
        }
        Update: {
          room_type_id?: string
          room_type_name?: string
          room_type_description?: string | null
        }
      }
      users: {
        Row: {
          user_id: string
          user_name: string
          user_email: string
          user_phone: string | null
          user_role: string | null
          user_created_at: string | null
          user_avatar: string | null
          is_banned: boolean | null
          banned_at: string | null
          ban_reason: string | null
        }
        Insert: {
          user_id: string
          user_name: string
          user_email: string
          user_phone?: string | null
          user_role?: string | null
          user_created_at?: string | null
          user_avatar?: string | null
          is_banned?: boolean | null
          banned_at?: string | null
          ban_reason?: string | null
        }
        Update: {
          user_id?: string
          user_name?: string
          user_email?: string
          user_phone?: string | null
          user_role?: string | null
          user_created_at?: string | null
          user_avatar?: string | null
          is_banned?: boolean | null
          banned_at?: string | null
          ban_reason?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_post_view: {
        Args: { post_id_param: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
