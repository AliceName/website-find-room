import Image from 'next/image'
import { Database } from '@/types/supabase'

type Room = Database['public']['Tables']['rooms']['Row']

interface RoomCardProps {
  room: Room;         // Dùng type Room đã trích xuất ở trên 
  imageUrl?: string;  // Dữ liệu bổ sung không nằm trong bảng rooms
}

export default function RoomCard({ room, imageUrl }: RoomCardProps) {
  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="relative aspect-[4/3] w-full bg-gray-100">
        <Image
          src={imageUrl || '/placeholder-room.jpg'} // Hiện ảnh mặc định nếu không có ảnh
          alt={room.room_description || 'Ảnh phòng trọ'}
          fill
          className="object-cover"
          priority={true}  // Thêm dòng này để ưu tiên tải ảnh LCP
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <p className="text-gray-600 mb-2 line-clamp-2">
        {room.room_description}
      </p>

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
  )
}
