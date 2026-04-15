interface RoomCardProps {
  room: {
    room_id: string;
    room_description: string;
    room_price: number;
    room_area: number;
  }
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <h2 className="font-semibold text-lg mb-2">
        Phòng mã: {room.room_id.slice(0, 8)}
      </h2>
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
