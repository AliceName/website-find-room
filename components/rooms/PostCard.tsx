import Image from 'next/image'
import { Database } from '@/types/supabase'

// Định nghĩa kiểu dữ liệu mở rộng cho Props của Card
// Giúp TypeScript hiểu được các bảng lồng nhau sau khi Join
interface PostCardProps {
    post: Database['public']['Tables']['posts']['Row'] & {
        rooms: (Database['public']['Tables']['rooms']['Row'] & {
            room_types?: Database['public']['Tables']['roomtypes']['Row'];
            roomimages?: Database['public']['Tables']['roomimages']['Row'][];
        }) | null;
    }
}

export default function PostCard({ post }: PostCardProps) {
    // 1. Lấy ảnh đại diện (Ưu tiên ảnh đầu tiên trong mảng roomimages)
    const thumbnail = post.rooms?.roomimages?.[0]?.image_url || '/placeholder-room.jpg'

    // 2. Định dạng giá tiền VNĐ
    const formattedPrice = post.rooms?.room_price
        ? post.rooms.room_price.toLocaleString('vi-VN')
        : '0';

    return (
        <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
            {/* KHU VỰC HÌNH ẢNH */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                    src={thumbnail}
                    alt={post.post_title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Label Loại phòng & Trạng thái */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {post.rooms?.room_types && (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                            {post.rooms.room_types.room_type_name}
                        </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase backdrop-blur-sm ${post.rooms?.room_status === 'available'
                        ? 'bg-green-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                        }`}>
                        {post.rooms?.room_status === 'available' ? 'Còn phòng' : 'Hết phòng'}
                    </span>
                </div>
            </div>

            {/* KHU VỰC NỘI DUNG */}
            <div className="p-5 flex flex-col flex-grow space-y-3">
                {/* Tiêu đề bài đăng */}
                <h3 className="font-bold text-gray-800 text-lg line-clamp-2 leading-tight min-h-[3rem]">
                    {post.post_title}
                </h3>

                {/* Thông tin diện tích */}
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-1">
                        <span>📏</span>
                        <span className="font-medium">{post.rooms?.room_area || 0} m²</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>📍</span>
                        <span className="truncate">Quận 9, TP.HCM</span>
                    </div>
                </div>

                {/* Giá và Nút chi tiết */}
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Giá thuê</p>
                        <p className="text-blue-600 font-black text-xl">
                            {formattedPrice} <span className="text-sm font-bold">đ</span>
                        </p>
                    </div>

                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}