import RoomVirtualSection from '@/components/rooms/RoomVirtualSection'
import RoomLocationMiniMap from '@/components/rooms/RoomLocationMiniMap'
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

    const lat = Number(room?.latitude);
    const lng = Number(room?.longitude);
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

    const mapQuery = hasValidCoords
        ? `${lat},${lng}`
        : encodeURIComponent(locationText);

    const openGoogleMapsUrl = hasValidCoords
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    const directionsGoogleMapsUrl = hasValidCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}&travelmode=driving`;

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
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 md:px-10 md:py-10">
            {/* HEADER */}
            <header className="overflow-hidden rounded-[3rem] border border-app bg-surface px-6 py-6 shadow-sm md:px-8 md:py-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
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

                        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-4xl">
                            {post.post_title}
                        </h1>

                        <p className="flex items-center gap-1 text-slate-500">
                            <span>📍</span>
                            <span>{locationText}</span>
                        </p>

                        <div className="grid grid-cols-1 gap-4 rounded-3xl border border-app bg-surface px-5 py-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-1">
                                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400">Giá thuê</span>
                                <span className="text-3xl font-black text-blue-600">
                                    {priceFormatted} <span className="text-base font-bold text-slate-400">/tháng</span>
                                </span>
                            </div>
                            <div className="hidden h-10 w-px bg-gray-100 md:block" />
                            <div className="space-y-1">
                                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400">Diện tích</span>
                                <span className="text-xl font-bold text-slate-700">📏 {room?.room_area} m²</span>
                            </div>
                            <div className="hidden space-y-1 md:block">
                                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400">Vị trí</span>
                                <span className="text-sm font-semibold text-slate-600">{locationText}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 lg:flex-col">
                        <FavoriteButton postId={post_id} />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                {/* LEFT COLUMN */}
                <div className="space-y-10 lg:col-span-8">
                    {/* Unified media section: normal images + 360 + external tour */}
                    {(normalImages.length > 0 || vrImages.length > 0 || externalVrUrl) && (
                        <div className="overflow-hidden rounded-[2.5rem] border border-app bg-surface shadow-sm">
                            <RoomVirtualSection
                                normalImages={normalImages.map((img) => img.image_url)}
                                vrImages={vrImages}
                                externalVrUrl={externalVrUrl}
                            />
                        </div>
                    )}

                    {/* No images placeholder */}
                    {!externalVrUrl && vrImages.length === 0 && normalImages.length === 0 && (
                        <div className="flex h-64 items-center justify-center rounded-[3rem] bg-surface-muted">
                            <div className="text-center">
                                <span className="text-6xl">🏠</span>
                                <p className="mt-3 font-medium text-slate-400">Chưa có hình ảnh</p>
                            </div>
                        </div>
                    )}

                    {/* Bản đồ vị trí */}
                    <section className="rounded-[3rem] border border-app bg-surface p-6 shadow-sm md:p-8">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
                                    <span className="h-8 w-2 rounded-full bg-blue-600" />
                                    Vị trí trên bản đồ
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">{locationText}</p>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={openGoogleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:border-blue-200 hover:text-blue-700"
                                >
                                    Mở trên Google Maps
                                </a>
                                <a
                                    href={directionsGoogleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-blue-700"
                                >
                                    Chỉ đường đến đây
                                </a>
                            </div>
                        </div>

                        {hasValidCoords ? (
                            <RoomLocationMiniMap
                                lat={lat}
                                lng={lng}
                                title={post.post_title}
                                locationText={locationText}
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <p className="text-sm font-medium text-slate-600">
                                    Chưa có tọa độ chính xác cho phòng này. Bạn vẫn có thể mở Google Maps để xem vị trí theo địa chỉ.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Description */}
                    {room?.room_description && (
                        <section className="rounded-[3rem] border border-app bg-surface p-8 shadow-sm md:p-10">
                            <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                                <span className="h-8 w-2 rounded-full bg-blue-600" />
                                Mô tả căn phòng
                            </h2>
                            <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">
                                {room.room_description}
                            </p>
                        </section>
                    )}

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <section className="rounded-[3rem] border border-app bg-surface p-8 shadow-sm">
                            <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                                <span className="h-8 w-2 rounded-full bg-green-500" />
                                Tiện ích phòng
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {amenities.map((amenity, i) => (
                                    <span key={i} className="rounded-2xl border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
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
                    <div className="sticky top-10 space-y-6 rounded-[3rem] bg-transparent">
                        {/* Contact Card */}
                        <div className="rounded-[3rem] border border-blue-100 bg-gradient-to-br from-blue-500 to-cyan-500 p-8 text-white shadow-2xl transition-transform duration-[220ms] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(59,130,246,0.24)]">
                            <div className="mb-8 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-lg backdrop-blur-sm">
                                    👤
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Chủ tin đăng</p>
                                    <h4 className="text-lg font-bold">{post.users?.user_name || 'Chủ trọ'}</h4>
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

                            <div className="mt-8 border-t border-white/20 pt-6 text-center">
                                <p className="text-xs font-medium uppercase tracking-tighter text-blue-100">
                                    Đăng ngày {post.post_created_at
                                        ? new Date(post.post_created_at).toLocaleDateString("vi-VN")
                                        : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="rounded-[2.5rem] border border-app bg-surface p-6 shadow-sm transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:shadow-md">
                            <h5 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Thông tin chi tiết</h5>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-50 py-2">
                                    <span className="text-sm text-slate-500">Diện tích</span>
                                    <span className="text-sm font-bold text-slate-900">{room?.room_area || '—'} m²</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-50 py-2">
                                    <span className="text-sm text-slate-500">Loại phòng</span>
                                    <span className="text-sm font-bold text-slate-900">{room?.room_types?.room_type_name || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-50 py-2">
                                    <span className="text-sm text-slate-500">Trạng thái</span>
                                    <span className={`text-sm font-bold ${room?.room_status !== false ? 'text-green-600' : 'text-red-500'}`}>
                                        {room?.room_status !== false ? 'Còn phòng' : 'Hết phòng'}
                                    </span>
                                </div>
                                {avgRating && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-slate-500">Đánh giá</span>
                                        <span className="text-sm font-bold text-yellow-600">⭐ {avgRating}/5</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amenities mini card */}
                        {amenities.length > 0 && (
                            <div className="rounded-[2.5rem] border border-blue-100 bg-blue-50 p-6 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-blue-100/60">
                                <h5 className="mb-4 text-center text-xs font-black uppercase tracking-widest text-blue-900">
                                    Tiện ích đi kèm
                                </h5>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {amenities.slice(0, 6).map((item, i) => (
                                        <span key={i} className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                                            ✓ {item}
                                        </span>
                                    ))}
                                    {amenities.length > 6 && (
                                        <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-400 shadow-sm">
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
        </div>
    );
}