import { supabase } from '@/lib/supabaseClient'
import RoomCard from '@/components/rooms/RoomCard'
import { Database } from '@/types/supabase'
import Link from 'next/link' // 1. Import thêm Link

type RoomFromDB = Database['public']['Tables']['rooms']['Row']

interface Room extends RoomFromDB {
  roomimages?: { image_url: string }[];
}

export default async function RoomsPage() {
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select(`
    *,
    roomimages (
      image_url
    )
  `)
    .eq('room_status', true);

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <strong>Lỗi kết nối:</strong> {error.message}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Danh sách phòng trọ</h1>

      {rooms?.length === 0 ? (
        <p>Hiện tại không có phòng nào khả dụng.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms?.map((room: Room) => {
            const firstImage = room.roomimages?.[0]?.image_url;

            return (
              /* 2. Bao bọc Card bằng Link và trỏ tới thư mục [id] */
              <Link
                key={room.room_id}
                href={`/rooms/${room.room_id}`}
                className="block transition-transform hover:scale-[1.02]"
              >
                <RoomCard
                  room={room}
                  imageUrl={firstImage}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}