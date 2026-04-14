import { supabase } from "@/lib/supabaseClient";
// 1. Lấy toàn bộ danh sách tiện ích có trong hệ thống (để hiện checkbox khi đăng bài)
export const getAllAmenities = async () => {
  const { data, error } = await supabase
    .from("amenities")
    .select("*")
    .order("amenity_name", { ascending: true });

  if (error) {
    console.error("Lỗi lấy danh sách tiện ích:", error.message);
    return [];
  }
  return data;
};

// 2. Lấy các tiện ích của một phòng cụ thể (dùng cho trang chi tiết phòng)
export const getAmenitiesByRoomId = async (roomId: string) => {
  const { data, error } = await supabase
    .from("RoomAmenities")
    .select(
      `
      amenity_id,
      Amenities (
      amenity_name
      )`,
    )
    .eq("room_id", roomId);
  if (error) {
    console.error("Lỗi lấy tiện ích:", error.message);
    return [];
  }
  return data;
};
// 3. Thêm tiện ích cho một phòng (Dùng khi chủ trọ lưu thông tin phòng)
export const addAmenitiesToRoom = async (
  roomId: string,
  amenityIds: string[],
) => {
  const insertData = amenityIds.map((id) => ({
    room_id: roomId,
    amenity_id: id,
  }));

  const { error } = await supabase.from("RoomAmenities").insert(insertData);

  return { error };
};

//4. Thêm tiện nghi
export const addAmenities = async (amenityName: string) => {
  const { data, error } = await supabase
    .from("amenities")
    .insert([{ amenity_name: amenityName }])
    .select();

  return { data, error };
};

//5.
// Sửa thông tin loại tiện nghi trong hệ thống
export const editSystemAmenity = async (amenityId: string, newName: string) => {
  const { data, error } = await supabase
    .from("Amenities")
    .update({ amenity_name: newName }) // Cập nhật tên mới
    .eq("amenity_id", amenityId) // Theo ID cụ thể
    .select();

  return { data, error };
};
