export type User = {
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone?: string;
    user_role?: "owner" | "renter" | "admin";
    user_created_at?: string;
};

export type Room = {
    room_id: string;
    room_description?: string;
    room_price: number;
    room_area?: number;
    location_id?: string;
    latitude?: number;
    longitude?: number;
    owner_id?: string;
    room_status?: "available" | "unavailable";
    room_type_id?: string;
    vr_url?: string; // Thêm trường vr_url để lưu URL của ảnh 360 độ
    room_created_at?: string;
};
export type Post = {
    post_id: string;
    post_title: string;
    room_id: string;
    user_id: string;
    post_created_at?: string;
    post_update_at?: string;
    post_expired_at?: string;
};

export type Favorite = {
    favorite_id: string;
    user_id?: string;
    post_id?: string;
    favorite_created_at?: string;
};

export type Review = {
    review_id: string;
    user_id?: string;
    room_id?: string;
    rating?: number;
    comment?: string;
    review_created_at?: string;
    review_updated_at?: string;
};
export type Amenity = {
    amenity_id: string;
    amenity_name: string;
};
export type RoomAmenity = {
    room_amenities_id: string;
    room_id?: string;
    amenity_id?: string;
};
export type RoomImage = {
    image_id: string;
    room_id?: string;
    image_url: string;
    is_360: boolean; // Thêm trường is_360 để phân biệt ảnh thường và ảnh 360 độ
};
export type Location = {
    location_id: string;
    city: string;
    district: string;
    ward: string;
};
export type RoomType = {
    room_type_id: string;
    room_type_name: string;
    room_type_description?: string;
};
