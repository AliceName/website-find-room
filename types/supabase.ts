export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      amenities: {
        Row: {
          amenity_id: string;
          amenity_name: string;
        };
        Insert: {
          amenity_id?: string;
          amenity_name: string;
        };
        Update: {
          amenity_id?: string;
          amenity_name?: string;
        };
      };
      conversations: {
        Row: {
          conversation_id: string;
          user_id_1: string | null;
          user_id_2: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          conversation_id?: string;
          user_id_1?: string | null;
          user_id_2?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          user_id_1?: string | null;
          user_id_2?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      favorites: {
        Row: {
          favority_id: string;
          user_id: string | null;
          post_id: string | null;
          favority_created_at: string | null;
        };
        Insert: {
          favority_id?: string;
          user_id?: string | null;
          post_id?: string | null;
          favority_created_at?: string | null;
        };
        Update: {
          favority_id?: string;
          user_id?: string | null;
          post_id?: string | null;
          favority_created_at?: string | null;
        };
      };
      locations: {
        Row: {
          location_id: string;
          city: string;
          district: string;
          ward: string;
        };
        Insert: {
          location_id?: string;
          city: string;
          district: string;
          ward: string;
        };
        Update: {
          location_id?: string;
          city?: string;
          district?: string;
          ward?: string;
        };
      };
      messages: {
        Row: {
          message_id: string;
          conversation_id: string;
          sender_user_id: string;
          message_content: string;
          message_type: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          message_id?: string;
          conversation_id: string;
          sender_user_id: string;
          message_content: string;
          message_type?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          message_id?: string;
          conversation_id?: string;
          sender_user_id?: string;
          message_content?: string;
          message_type?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      posts: {
        Row: {
          post_id: string;
          room_id: string | null;
          post_title: string;
          user_id: string | null;
          post_created_at: string | null;
          post_update_at: string | null;
          post_expired_at: string | null;
          view_count: number | null;
        };
        Insert: {
          post_id?: string;
          room_id?: string | null;
          post_title: string;
          user_id?: string | null;
          post_created_at?: string | null;
          post_update_at?: string | null;
          post_expired_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          post_id?: string;
          room_id?: string | null;
          post_title?: string;
          user_id?: string | null;
          post_created_at?: string | null;
          post_update_at?: string | null;
          post_expired_at?: string | null;
          view_count?: number | null;
        };
      };
      reviews: {
        Row: {
          review_id: string;
          user_id: string | null;
          room_id: string | null;
          rating: number | null;
          comment: string | null;
          review_created_at: string | null;
          review_updated_at: string | null;
        };
        Insert: {
          review_id?: string;
          user_id?: string | null;
          room_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          review_created_at?: string | null;
          review_updated_at?: string | null;
        };
        Update: {
          review_id?: string;
          user_id?: string | null;
          room_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          review_created_at?: string | null;
          review_updated_at?: string | null;
        };
      };
      roomamenities: {
        Row: {
          room_amenities_id: string;
          room_id: string | null;
          amenity_id: string | null;
        };
        Insert: {
          room_amenities_id?: string;
          room_id?: string | null;
          amenity_id?: string | null;
        };
        Update: {
          room_amenities_id?: string;
          room_id?: string | null;
          amenity_id?: string | null;
        };
      };
      roomimages: {
        Row: {
          image_id: string;
          room_id: string | null;
          image_url: string;
          is_360: boolean | null;
        };
        Insert: {
          image_id?: string;
          room_id?: string | null;
          image_url: string;
          is_360?: boolean | null;
        };
        Update: {
          image_id?: string;
          room_id?: string | null;
          image_url?: string;
          is_360?: boolean | null;
        };
      };
      rooms: {
        Row: {
          room_id: string;
          room_description: string | null;
          room_price: number;
          room_area: number | null;
          location_id: string | null;
          latitude: number | null;
          longitude: number | null;
          owner_id: string | null;
          room_status: boolean | null;
          room_type_id: string | null;
          room_created_at: string | null;
          vr_url: string | null;
        };
        Insert: {
          room_id?: string;
          room_description?: string | null;
          room_price: number;
          room_area?: number | null;
          location_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          owner_id?: string | null;
          room_status?: boolean | null;
          room_type_id?: string | null;
          room_created_at?: string | null;
          vr_url?: string | null;
        };
        Update: {
          room_id?: string;
          room_description?: string | null;
          room_price?: number;
          room_area?: number | null;
          location_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          owner_id?: string | null;
          room_status?: boolean | null;
          room_type_id?: string | null;
          room_created_at?: string | null;
          vr_url?: string | null;
        };
      };
      roomtypes: {
        Row: {
          room_type_id: string;
          room_type_name: string;
          room_type_description: string | null;
        };
        Insert: {
          room_type_id?: string;
          room_type_name: string;
          room_type_description?: string | null;
        };
        Update: {
          room_type_id?: string;
          room_type_name?: string;
          room_type_description?: string | null;
        };
      };
      users: {
        Row: {
          user_id: string;
          user_name: string;
          user_email: string;
          user_phone: string | null;
          user_role: string | null;
          user_created_at: string | null;
          user_avatar: string | null;
        };
        Insert: {
          user_id: string;
          user_name: string;
          user_email: string;
          user_phone?: string | null;
          user_role?: string | null;
          user_created_at?: string | null;
          user_avatar?: string | null;
        };
        Update: {
          user_id?: string;
          user_name?: string;
          user_email?: string;
          user_phone?: string | null;
          user_role?: string | null;
          user_created_at?: string | null;
          user_avatar?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_post_view: {
        Args: { post_id_param: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
