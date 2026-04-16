import { Database } from '@/types/supabase'
import Image from 'next/image'

// Cách trích xuất kiểu dữ liệu cho 1 tấm ảnh từ Database
type RoomImage = Database['public']['Tables']['roomimages']['Row']

export default function RoomGallery({ images }: { images: RoomImage[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img) => (
                <Image
                    key={img.image_id} // Bây giờ TypeScript sẽ hiểu image_id là gì [cite: 24, 25]
                    src={img.image_url} // Và gợi ý đúng image_url [cite: 24, 25]
                    alt="Phòng trọ"
                    className="rounded-lg object-cover h-40 w-full hover:opacity-80 transition cursor-pointer"
                />
            ))}
        </div>
    )
}