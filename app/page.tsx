import { supabase } from '@/lib/supabaseClient'

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
            <div key={room.room_id} className="border rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <h2 className="font-semibold text-lg mb-2">Phòng mã: {room.room_id.slice(0, 8)}</h2>
              <p className="text-gray-600 mb-2 line-clamp-2">{room.room_description}</p>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-blue-600 font-bold">
                  {room.room_price.toLocaleString('vi-VN')} VNĐ
                </span>
                <span className="text-sm text-gray-500">
                  {room.room_area} m²
                </span>
              </div>
              
              <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
                Xem chi tiết
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}