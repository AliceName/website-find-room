import Image from 'next/image'
import { Database } from '@/types/supabase'

interface PostCardProps {
    post: Database['public']['Tables']['posts']['Row'] & {
        rooms: (Database['public']['Tables']['rooms']['Row'] & {
            room_types?: Database['public']['Tables']['roomtypes']['Row'] | null;
            roomimages?: Database['public']['Tables']['roomimages']['Row'][];
            locations?: Database['public']['Tables']['locations']['Row'] | null;
        }) | null;
    }
}

export default function PostCard({ post }: PostCardProps) {
    const thumbnail = post.rooms?.roomimages?.[0]?.image_url || '/placeholder-room.jpg'

    const formattedPrice = post.rooms?.room_price
        ? post.rooms.room_price >= 1_000_000
            ? (post.rooms.room_price / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' triệu'
            : post.rooms.room_price.toLocaleString('vi-VN') + ' đ'
        : '0';

    // room_status is boolean: true = còn phòng, false = hết phòng
    const isAvailable = post.rooms?.room_status !== false;

    const location = post.rooms?.locations;
    const locationText = location
        ? [location.district, location.city].filter(Boolean).join(', ')
        : 'TP. Hồ Chí Minh';

    const hasVR = !!(post.rooms?.vr_url || post.rooms?.roomimages?.some(img => img.is_360));

    return (
        <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer">
            {/* KHU VỰC HÌNH ẢNH */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                {thumbnail !== '/placeholder-room.jpg' ? (
                    <Image
                        src={thumbnail}
                        alt={post.post_title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                        <span className="text-5xl">🏠</span>
                    </div>
                )}

                {/* Labels */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {post.rooms?.room_types && (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                            {post.rooms.room_types.room_type_name}
                        </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase backdrop-blur-sm ${
                        isAvailable
                            ? 'bg-green-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                    }`}>
                        {isAvailable ? 'Còn phòng' : 'Hết phòng'}
                    </span>
                </div>

                {/* VR badge */}
                {hasVR && (
                    <div className="absolute top-3 right-3">
                        <span className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                            <span>🥽</span> VR
                        </span>
                    </div>
                )}
            </div>

            {/* KHU VỰC NỘI DUNG */}
            <div className="p-5 flex flex-col flex-grow space-y-3">
                <h3 className="font-bold text-gray-800 text-base line-clamp-2 leading-tight min-h-[2.8rem]">
                    {post.post_title}
                </h3>

                <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-1">
                        <span>📏</span>
                        <span className="font-medium">{post.rooms?.room_area || 0} m²</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <span>📍</span>
                        <span className="truncate text-xs">{locationText}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Giá thuê/tháng</p>
                        <p className="text-blue-600 font-black text-xl">
                            {formattedPrice}
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
