import { supabase } from '@/lib/supabaseClient'
import PostCard from '@/components/rooms/PostCard'
import Link from 'next/link'

export default async function HomePage() {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            post_id,
            post_title,
            post_created_at,
            rooms:room_id (
                room_id,
                room_price,
                room_area,
                room_status,
                vr_url,
                room_types:room_type_id (
                    room_type_id,
                    room_type_name
                ),
                roomimages (
                    image_url,
                    is_360
                ),
                locations:location_id (
                    location_id,
                    city,
                    district,
                    ward
                )
            )
        `)
        .order('post_created_at', { ascending: false })
        .limit(6);

    if (error) {
        console.error('Lỗi lấy dữ liệu:', error);
    }

    const posts = data as unknown as any[] | null;

    return (
        <div className="min-h-screen">
            {/* HERO SECTION */}
            <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                        Tìm phòng trọ ưng ý<br />
                        <span className="text-blue-200">nhanh chóng & minh bạch</span>
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                        Khám phá hàng trăm phòng trọ với tour VR 360° thực tế. Không cần đến tận nơi, vẫn chọn được phòng ưng ý.
                    </p>

                    {/* Quick Search */}
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-3xl p-2 flex gap-2 shadow-2xl">
                            <input
                                type="text"
                                placeholder="Nhập quận, phường, khu vực..."
                                className="flex-1 px-5 py-3 text-gray-800 text-sm font-medium bg-transparent focus:outline-none rounded-2xl"
                                readOnly
                            />
                            <Link
                                href="/rooms"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap"
                            >
                                🔍 Tìm kiếm
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
                        {[
                            { icon: "🏠", label: "Phòng trọ", value: "500+" },
                            { icon: "🥽", label: "Tour VR 360°", value: "200+" },
                            { icon: "👥", label: "Người thuê", value: "1000+" },
                            { icon: "⭐", label: "Đánh giá", value: "4.8/5" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl mb-1">{stat.icon}</div>
                                <div className="text-2xl font-black">{stat.value}</div>
                                <div className="text-blue-200 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="bg-gray-50 py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-black text-center text-gray-900 mb-12">
                        Tại sao chọn <span className="text-blue-600">FindRoom</span>?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: "🥽",
                                title: "Tour VR 360°",
                                desc: "Xem phòng thực tế với công nghệ VR. Không cần đến tận nơi vẫn cảm nhận được không gian."
                            },
                            {
                                icon: "📍",
                                title: "Bản đồ trực quan",
                                desc: "Tìm phòng gần nơi học/làm việc chỉ với một cái nhìn. Hiển thị tất cả phòng trống trên bản đồ."
                            },
                            {
                                icon: "⭐",
                                title: "Đánh giá thực tế",
                                desc: "Đọc đánh giá từ người đã thuê. Lựa chọn phòng với đầy đủ thông tin minh bạch."
                            },
                        ].map(f => (
                            <div key={f.title} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-all">
                                <div className="text-5xl mb-4">{f.icon}</div>
                                <h3 className="text-xl font-black text-gray-900 mb-3">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* POSTS */}
            <section className="max-w-7xl mx-auto px-4 py-16 space-y-8">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                            🔥 Tin mới cập nhật
                        </h2>
                        <p className="text-gray-500 font-medium mt-1">Những căn phòng tốt nhất vừa được đăng tải</p>
                    </div>
                    <Link href="/rooms" className="text-blue-600 font-bold hover:underline hidden md:block text-sm">
                        Xem tất cả →
                    </Link>
                </div>

                {!posts || posts.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <span className="text-5xl">🏚️</span>
                        <p className="text-gray-400 font-medium mt-4">Hiện tại chưa có bài đăng nào.</p>
                        <Link href="/post" className="mt-4 inline-block text-blue-600 font-bold hover:underline text-sm">
                            Đăng tin ngay →
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post) => (
                                <Link key={post.post_id} href={`/rooms/${post.post_id}`}>
                                    <PostCard post={post} />
                                </Link>
                            ))}
                        </div>
                        <div className="text-center">
                            <Link
                                href="/rooms"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200"
                            >
                                Xem tất cả phòng trọ →
                            </Link>
                        </div>
                    </>
                )}
            </section>

            {/* AREAS */}
            <section className="bg-gray-900 py-16 px-4 text-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-black mb-2">Khu vực phổ biến</h2>
                    <p className="text-gray-400 text-sm mb-8">Tìm phòng trọ tại các khu vực có nhiều trường đại học</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'Quận 9 / TP. Thủ Đức', count: '20+', icon: '🏫' },
                            { name: 'Bình Thạnh', count: '15+', icon: '🌆' },
                            { name: 'Tân Bình', count: '18+', icon: '✈️' },
                            { name: 'Gò Vấp', count: '12+', icon: '🎓' },
                        ].map((loc) => (
                            <Link
                                key={loc.name}
                                href={`/rooms?search=${encodeURIComponent(loc.name)}`}
                                className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 transition-colors cursor-pointer"
                            >
                                <div className="text-2xl mb-2">{loc.icon}</div>
                                <p className="font-bold text-sm">{loc.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{loc.count} phòng</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4 bg-blue-50">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Bạn có phòng muốn cho thuê?</h2>
                    <p className="text-gray-500 mb-8">Đăng tin miễn phí và tiếp cận hàng nghìn người thuê tiềm năng ngay hôm nay</p>
                    <Link
                        href="/post"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-200"
                    >
                        📝 Đăng tin cho thuê ngay
                    </Link>
                </div>
            </section>
        </div>
    );
}
