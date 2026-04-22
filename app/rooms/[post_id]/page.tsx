import RoomVirtualSection from '@/components/rooms/RoomVirtualSection'
import ReviewSection from '@/components/rooms/ReviewSection'
import FavoriteButton from '@/components/rooms/FavoriteButton'
import { Badge, ContactButton } from '@/components/common'
import { supabase } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'
import { Database } from '@/types/supabase'
import '@/app/globals.css'

type PostDetail = Database['public']['Tables']['posts']['Row'] & {
    rooms: (Database['public']['Tables']['rooms']['Row'] & {
        room_types: { room_type_name: string } | null;
        roomimages: { image_url: string; is_360: boolean | null }[];
        locations: { city: string; district: string; ward: string } | null;
        roomamenities: {
            amenities: { amenity_name: string } | null;
        }[];
    }) | null;
    users: { user_name: string; user_phone: string | null; user_email: string } | null;
};

export default async function RoomDetailPage({ params }: { params: Promise<{ post_id: string }> }) {
    const { post_id } = await params;

    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            rooms:room_id (
                *,
                room_types:room_type_id ( room_type_name ),
                roomimages ( image_url, is_360 ),
                locations:location_id ( city, district, ward ),
                roomamenities (
                    amenities:amenity_id ( amenity_name )
                )
            ),
            users:user_id ( user_name, user_phone, user_email )
        `)
        .eq('post_id', post_id)
        .single();

    if (error || !data) return notFound();

    const post = data as unknown as PostDetail;
    const room = post.rooms;
    const normalImages = room?.roomimages.filter(img => !img.is_360) || [];
    const vrImages = room?.roomimages
        .filter((img) => img.is_360)
        .map((img) => img.image_url) || [];
    const externalVrUrl = room?.vr_url || null;
    const amenities = room?.roomamenities?.map(ra => ra.amenities?.amenity_name).filter(Boolean) || [];

    const location = room?.locations;
    const locationText = location
        ? [location.ward, location.district, location.city].filter(Boolean).join(', ')
        : 'TP. Hồ Chí Minh';

    const priceFormatted = room?.room_price
        ? room.room_price >= 1_000_000
            ? (room.room_price / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' triệu'
            : room.room_price.toLocaleString('vi-VN') + ' đ'
        : '0';

    // Get average rating
    const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('room_id', room?.room_id || '');

    const avgRating = reviewsData && reviewsData.length > 0
        ? (reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length).toFixed(1)
        : null;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-700">
            {/* HEADER */}
            <header className="space-y-4 border-b pb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {room?.room_types && (
                                <Badge variant="info" size="md">
                                    {room.room_types.room_type_name}
                                </Badge>
                            )}
                            <Badge
                                variant={room?.room_status !== false ? "success" : "danger"}
                                size="md"
                                icon={room?.room_status !== false ? "✓" : "✗"}
                            >
                                {room?.room_status !== false ? "Còn phòng" : "Hết phòng"}
                            </Badge>
                            {avgRating && (
                                <Badge variant="warning" size="md" icon="⭐">
                                    {avgRating} ({reviewsData?.length} đánh giá)
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            {post.post_title}
                        </h1>

                        <p className="text-gray-500 flex items-center gap-1">
                            <span>📍</span>
                            <span>{locationText}</span>
                        </p>

                        <div className="flex items-center gap-6">
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block">Giá thuê</span>
                                <span className="text-3xl font-black text-blue-600">
                                    {priceFormatted} <span className="text-base font-bold text-gray-400">/tháng</span>
                                </span>
                            </div>
                            <div className="h-10 w-[2px] bg-gray-100 hidden md:block" />
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block">Diện tích</span>
                                <span className="text-xl font-bold text-gray-700">📏 {room?.room_area} m²</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 md:flex-col">
                        <FavoriteButton postId={post_id} />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Unified media section: normal images + 360 + external tour */}
                    {(normalImages.length > 0 || vrImages.length > 0 || externalVrUrl) && (
                        <RoomVirtualSection
                            normalImages={normalImages.map((img) => img.image_url)}
                            vrImages={vrImages}
                            externalVrUrl={externalVrUrl}
                        />
                    )}

                    {/* No images placeholder */}
                    {!externalVrUrl && vrImages.length === 0 && normalImages.length === 0 && (
                        <div className="rounded-[3rem] bg-gray-100 h-64 flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-6xl">🏠</span>
                                <p className="text-gray-400 mt-3 font-medium">Chưa có hình ảnh</p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {room?.room_description && (
                        <section className="bg-gray-50/50 p-8 md:p-10 rounded-[3rem] border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-blue-600 rounded-full" />
                                Mô tả căn phòng
                            </h2>
                            <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                                {room.room_description}
                            </p>
                        </section>
                    )}

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-green-500 rounded-full" />
                                Tiện ích phòng
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {amenities.map((amenity, i) => (
                                    <span key={i} className="bg-green-50 text-green-700 px-4 py-2 rounded-2xl text-sm font-bold border border-green-100">
                                        ✓ {amenity}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Reviews Section */}
                    <ReviewSection roomId={room?.room_id || ''} />
                </div>

                {/* RIGHT COLUMN - Sidebar */}
                <aside className="lg:col-span-4">
                    <div className="sticky top-10 space-y-6">
                        {/* Contact Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[3rem] p-8 text-white shadow-2xl border-t-8 border-blue-400">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                                    👤
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Chủ tin đăng</p>
                                    <h4 className="font-bold text-lg">{post.users?.user_name || 'Chủ trọ'}</h4>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <ContactButton
                                    ownerPhone={post.users?.user_phone}
                                    ownerEmail={post.users?.user_email}
                                    ownerName={post.users?.user_name}
                                    roomTitle={post.post_title}
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/20 text-center">
                                <p className="text-blue-100 text-xs font-medium uppercase tracking-tighter">
                                    Đăng ngày {post.post_created_at
                                        ? new Date(post.post_created_at).toLocaleDateString("vi-VN")
                                        : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                            <h5 className="font-black text-gray-800 mb-4 text-sm uppercase tracking-widest">Thông tin chi tiết</h5>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Diện tích</span>
                                    <span className="font-bold text-sm">{room?.room_area || '—'} m²</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Loại phòng</span>
                                    <span className="font-bold text-sm">{room?.room_types?.room_type_name || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Trạng thái</span>
                                    <span className={`font-bold text-sm ${room?.room_status !== false ? 'text-green-600' : 'text-red-500'}`}>
                                        {room?.room_status !== false ? 'Còn phòng' : 'Hết phòng'}
                                    </span>
                                </div>
                                {avgRating && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-500 text-sm">Đánh giá</span>
                                        <span className="font-bold text-sm text-yellow-600">⭐ {avgRating}/5</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amenities mini card */}
                        {amenities.length > 0 && (
                            <div className="bg-blue-50 rounded-[2.5rem] p-6 border border-blue-100">
                                <h5 className="font-black text-blue-900 mb-4 text-xs uppercase tracking-widest text-center">
                                    Tiện ích đi kèm
                                </h5>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {amenities.slice(0, 6).map((item, i) => (
                                        <span key={i} className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 shadow-sm">
                                            ✓ {item}
                                        </span>
                                    ))}
                                    {amenities.length > 6 && (
                                        <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 shadow-sm">
                                            +{amenities.length - 6} khác
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
