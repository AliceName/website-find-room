import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";

const valueProps = [
    {
        icon: "🔍",
        title: "Lọc đúng phòng trong vài thao tác",
        desc: "Chọn nhanh khu vực, giá, diện tích và loại phòng theo nhu cầu thực tế.",
    },
    {
        icon: "🥽",
        title: "Xem trước không gian bằng VR 360°",
        desc: "Kiểm tra cảm giác căn phòng trước khi đi xem trực tiếp, tiết kiệm thời gian di chuyển.",
    },
    {
        icon: "📝",
        title: "Đăng tin với cấu trúc rõ ràng",
        desc: "Thông tin được trình bày nhất quán để người thuê so sánh nhanh hơn.",
    },
];

const stats = [
    { label: "Tin đăng đang hoạt động", value: "500+" },
    { label: "Bài có VR 360°", value: "200+" },
    { label: "Khu vực được tìm nhiều", value: "20+" },
    { label: "Đánh giá trải nghiệm", value: "4.8/5" },
];

const areas = [
    { name: "TP. Hồ Chí Minh", hint: "Nguồn cung lớn, nhiều lựa chọn", icon: "🌇" },
    { name: "Hà Nội", hint: "Nhu cầu cao, phù hợp sinh viên và người đi làm", icon: "🏙️" },
    { name: "Thủ Đức", hint: "Gần trường, thuận tiện di chuyển", icon: "🏫" },
    { name: "Bình Thạnh", hint: "Giữ nhịp trung tâm nhưng vẫn linh hoạt", icon: "🌉" },
];

export default async function HomePage() {
    const { data, error } = await supabase
        .from("posts")
        .select(`
            post_id,
            post_title,
            post_created_at,
            view_count,
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
        .order("post_created_at", { ascending: false })
        .limit(6);

    if (error) console.error("Lỗi lấy dữ liệu:", error);

    const posts = (data as unknown as any[] | null) ?? [];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <section className="px-4 pt-8 pb-12 md:pt-14 md:pb-16">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
                        <div className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:p-10">
                            <div>
                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                    Tìm phòng rõ ràng, quyết định tự tin hơn
                                </span>
                                <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl md:leading-[1.02]">
                                    Phòng trọ phù hợp,
                                    <span className="block text-blue-600">lọc gọn trong vài phút</span>
                                </h1>
                                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                                    Tập trung vào điều người thuê cần nhất, giá, diện tích, khu vực, tiện ích và hình ảnh thực tế.
                                    Trải nghiệm đơn giản, nhất quán và đủ tin cậy để đi tới quyết định.
                                </p>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/rooms"
                                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    🔍 Khám phá phòng trọ
                                </Link>
                                <Link
                                    href="/post"
                                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                                >
                                    📝 Đăng tin cho thuê
                                </Link>
                            </div>

                            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-xl font-black text-slate-950">{stat.value}</div>
                                        <div className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                            <div className="rounded-[1.5rem] bg-slate-100 p-4 md:p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <span>📍</span>
                                    Tìm từ khu vực bạn đang quan tâm
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Chuyển thẳng tới danh sách phòng và dùng bộ lọc để thu hẹp theo khu vực, giá, diện tích.
                                </p>
                                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    <input
                                        type="text"
                                        value=""
                                        placeholder="Ví dụ: Thủ Đức, Bình Thạnh, Hà Nội..."
                                        readOnly
                                        aria-label="Tìm nhanh khu vực"
                                        className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-500 outline-none"
                                    />
                                    <Link
                                        href="/rooms"
                                        className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:from-blue-700 hover:to-cyan-600"
                                    >
                                        Tìm ngay
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Tại sao tìm phòng ở đây</p>
                                        <h2 className="mt-1 text-sm font-black text-slate-950">3 lý do khiến việc tìm phòng dễ hơn</h2>
                                    </div>
                                    <span className="text-lg">✨</span>
                                </div>
                                <div className="mt-4 grid gap-3">
                                    {valueProps.map((item) => (
                                        <div key={item.title} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                                            <div className="text-2xl leading-none">{item.icon}</div>
                                            <div>
                                                <div className="text-sm font-black text-slate-950">{item.title}</div>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-14 md:py-16">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                        <div className="max-w-2xl">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Bài đăng mới</p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">Tin mới cập nhật</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500 md:text-base">
                                Những bài đăng vừa được thêm gần đây, ưu tiên thông tin rõ ràng để so sánh nhanh.
                            </p>
                        </div>
                        <Link href="/rooms" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                            Xem tất cả →
                        </Link>
                    </div>

                    {!posts.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                            <div className="text-5xl">🏚️</div>
                            <p className="mt-4 text-sm font-medium text-slate-500">Hiện chưa có bài đăng nào.</p>
                            <Link href="/post" className="mt-5 inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                Đăng tin ngay
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {posts.map((post) => (
                                    <Link key={post.post_id} href={`/rooms/${post.post_id}`} className="block">
                                        <PostCard post={post} />
                                    </Link>
                                ))}
                            </div>
                            <div className="flex justify-center pt-2">
                                <Link
                                    href="/rooms"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-black text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Xem tất cả phòng trọ →
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <section className="px-4 py-14 md:py-16">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Khu vực được tìm nhiều</p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Khu vực phổ biến</h2>
                            <p className="mt-2 text-sm text-slate-500">Lối tắt tới những khu vực người thuê truy cập nhiều nhất.</p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {areas.map((area) => (
                            <Link
                                key={area.name}
                                href={`/rooms?search=${encodeURIComponent(area.name)}`}
                                className="group rounded-3xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="text-2xl">{area.icon}</div>
                                <div className="mt-4 text-base font-black text-slate-950">{area.name}</div>
                                <p className="mt-1 text-sm leading-6 text-slate-500">{area.hint}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 pb-16 pt-2 md:pb-20">
                <div className="mx-auto max-w-7xl rounded-[2rem] border border-blue-100 bg-blue-50 px-6 py-10 text-center md:px-10 md:py-14">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Dành cho chủ trọ</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">Bạn có phòng muốn cho thuê?</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                        Đăng tin miễn phí, trình bày rõ ràng và tiếp cận người thuê đang chủ động tìm phòng.
                    </p>
                    <Link
                        href="/post"
                        className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-sm font-black text-white transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                        📝 Đăng tin cho thuê ngay
                    </Link>
                </div>
            </section>
        </div>
    );
}
