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
        <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-app bg-surface shadow-sm transition-all duration-[220ms] ease-[var(--ease-out-quart)] hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20">
            {/* KHU VỰC HÌNH ẢNH */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                {thumbnail !== '/placeholder-room.jpg' ? (
                    <Image
                        src={thumbnail}
                        alt={post.post_title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[420ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-muted transition-transform duration-[220ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.02]">
                        <span className="text-5xl">🏠</span>
                    </div>
                )}

                {/* Labels */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {post.rooms?.room_types && (
                        <span className="rounded-lg bg-accent-app/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-transform duration-[180ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.02]">
                            {post.rooms.room_types.room_type_name}
                        </span>
                    )}
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase backdrop-blur-sm transition-transform duration-[180ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.02] ${
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
                        <span className="flex items-center gap-1 rounded-lg bg-purple-600/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm transition-transform duration-[180ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.02]">
                            <span>🥽</span> VR
                        </span>
                    </div>
                )}
            </div>

            {/* KHU VỰC NỘI DUNG */}
            <div className="flex flex-grow flex-col space-y-3 p-5 transition-transform duration-[220ms] ease-[var(--ease-out-quart)] group-hover:translate-y-[-1px]">
                <h3 className="min-h-[2.8rem] text-base font-bold leading-tight text-slate-800 line-clamp-2 transition-colors duration-[180ms] ease-[var(--ease-out-quart)] group-hover:text-slate-950">
                    {post.post_title}
                </h3>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <span>📏</span>
                        <span className="font-medium">{post.rooms?.room_area || 0} m²</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <span>📍</span>
                        <span className="truncate text-xs">{locationText}</span>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Giá thuê/tháng</p>
                        <p className="text-xl font-black text-accent-app transition-transform duration-[180ms] ease-[var(--ease-out-quart)] group-hover:translate-x-0.5">
                            {formattedPrice}
                        </p>
                    </div>

                    <div className="rounded-xl bg-surface-muted p-2 text-accent-app transition-all duration-[180ms] ease-[var(--ease-out-quart)] group-hover:bg-accent-app group-hover:text-white group-hover:translate-x-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}
