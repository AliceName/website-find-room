import { supabase } from "@/lib/supabaseClient";

// 1. Hàm upload ảnh lên Storage và lấy URL
export const uploadRoomImage = async (file: File, roomId: string) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${roomId}/${Math.random()}.${fileExt}`; // Tạo tên file duy nhất theo roomId

  // Đẩy file lên bucket 'room-images'
  const { data, error } = await supabase.storage
    .from("room-images")
    .upload(fileName, file);

  if (error) return { error };

  // Lấy URL công khai
  const {
    data: { publicUrl },
  } = supabase.storage.from("room-images").getPublicUrl(fileName);

  // Lưu URL này vào bảng RoomImages trong Database
  const { error: dbError } = await supabase
    .from("RoomImages")
    .insert([{ room_id: roomId, image_url: publicUrl }]);

  return { publicUrl, error: dbError };
};
