import { supabase } from '@/lib/supabaseClient'
import RoomCard from '@/components/rooms/RoomCard'

// 1. Định nghĩa kiểu dữ liệu để TypeScript hiểu cấu trúc bảng Rooms của Nga
interface Room {
  room_id: string;
  post_title?: string; // Tiêu đề thường nằm ở bảng Posts, nhưng nếu bạn muốn lấy nhanh
  room_description: string;
  room_price: number;
  room_area: number;
  room_status: boolean;
}

export default async function RoomsPage() {
  // 2. Truy vấn dữ liệu từ bảng 'rooms' theo đúng tên cột trong SQL bạn vừa chạy
  // Mình lấy thêm thông tin từ bảng Posts (nếu đã thiết lập quan hệ)
  const { data: rooms, error } = await supabase
    .from('rooms') 
    .select('*')
    .eq('room_status', true); // Trong SQL của bạn, true là còn phòng 

  // 3. Xử lý lỗi kết nối
  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <strong>Lỗi kết nối:</strong> {error.message}
      </div>
    );
  }

  // 4. Hiển thị giao diện
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Danh sách phòng trọ đang trống</h1>
      
      {rooms?.length === 0 ? (
        <p>Hiện tại không có phòng nào khả dụng.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms?.map((room) => (
            <RoomCard key={room.room_id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}