import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";
import {
    Search,
    Sparkles,
    MapPin,
    Building2,
    House,
    ArrowRight,
    ScanSearch,
    ShieldCheck,
    BadgeCheck,
} from "lucide-react";

const valueProps = [
    {
        icon: <Search className="h-5 w-5" />,
        title: "Lọc đúng phòng trong vài thao tác",
        desc: "Chọn nhanh khu vực, giá, diện tích và loại phòng theo nhu cầu thực tế.",
    },
    {
        icon: <Sparkles className="h-5 w-5" />,
        title: "Xem trước không gian bằng VR 360°",
        desc: "Kiểm tra cảm giác căn phòng trước khi đi xem trực tiếp.",
    },
    {
        icon: <BadgeCheck className="h-5 w-5" />,
        title: "Đăng tin chuyên nghiệp",
        desc: "Thông tin được trình bày rõ ràng và hiện đại hơn.",
    },
];

const stats = [
    { label: "Tin đăng hoạt động", value: "500+" },
    { label: "Phòng có VR 360°", value: "200+" },
    { label: "Khu vực nổi bật", value: "20+" },
    { label: "Đánh giá trải nghiệm", value: "4.8/5" },
];

const areas = [
    {
        name: "TP. Hồ Chí Minh",
        hint: "Nguồn cung lớn, nhiều lựa chọn",
        icon: "🌆",
    },
    {
        name: "Hà Nội",
        hint: "Nhu cầu cao, phù hợp sinh viên",
        icon: "🏙️",
    },
    {
        name: "Thủ Đức",
        hint: "Gần trường đại học",
        icon: "🏫",
    },
    {
        name: "Bình Thạnh",
        hint: "Kết nối nhanh trung tâm",
        icon: "🌉",
    },
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
                is_hidden,
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

    if (error) console.error(error);

    const posts =
        ((data as unknown as any[] | null) ?? []).filter(
            (post) => post.rooms?.is_hidden !== true
        );

    return (
        <div className="relative min-h-screen bg-[#F0F9FF] text-slate-800 overflow-hidden">
            {/* Background Pattern + Glows */}
            <div className="fixed inset-0 -z-10">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                <div className="absolute left-[-150px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[#7DD3FC]/50 blur-[120px]" />
                <div className="absolute bottom-[-120px] right-[-150px] h-[480px] w-[480px] rounded-full bg-[#0EA5E9]/30 blur-[130px]" />
            </div>

            {/* HERO */}
            <section className="relative px-4 pb-16 pt-10 md:pt-20">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                        {/* LEFT - Hero Content */}
                        <div className="relative overflow-hidden rounded-[36px] border border-sky-100 bg-white p-8 shadow-2xl md:p-12">
                            <div className="relative">
                                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0EA5E9]">
                                    <Sparkles className="h-4 w-4" />
                                    Nền tảng tìm phòng hiện đại
                                </span>

                                <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-7xl">
                                    Tìm phòng
                                    <span className="block bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] bg-clip-text text-transparent">
                                        nhanh hơn,
                                    </span>
                                    dễ dàng hơn.
                                </h1>

                                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                                    Nền tảng tìm phòng trọ hiện đại với VR 360°, giao diện sạch sẽ và hệ thống lọc thông minh.
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href="/rooms"
                                        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] px-8 py-4 text-base font-black text-white shadow-xl shadow-sky-300 transition-all hover:scale-[1.02]"
                                    >
                                        <ScanSearch className="h-5 w-5" />
                                        Khám phá phòng
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>

                                    <Link
                                        href="/post"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-8 py-4 text-base font-bold text-slate-700 transition hover:bg-sky-50"
                                    >
                                        <House className="h-5 w-5" />
                                        Đăng tin cho thuê
                                    </Link>
                                </div>

                                {/* STATS */}
                                <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {stats.map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
                                        >
                                            <div className="text-3xl font-black text-[#0EA5E9]">
                                                {stat.value}
                                            </div>
                                            <div className="mt-1 text-sm font-medium text-slate-500">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="grid gap-6">
                            {/* Quick Search */}
                            <div className="overflow-hidden rounded-[32px] border border-sky-100 bg-white p-8 shadow-xl">
                                <div className="flex items-center gap-3 text-[#0EA5E9]">
                                    <MapPin className="h-6 w-6" />
                                    <span className="font-bold">Tìm theo khu vực</span>
                                </div>

                                <p className="mt-3 text-slate-600">
                                    Khám phá phòng phù hợp theo vị trí, giá và tiện ích bạn cần.
                                </p>

                                <div className="mt-6 flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="Thủ Đức, Bình Thạnh, Quận 1..."
                                            className="h-14 w-full rounded-2xl border border-sky-200 bg-white pl-12 pr-5 text-slate-700 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                        />
                                    </div>

                                    <Link
                                        href="/rooms"
                                        className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] px-8 font-bold text-white hover:brightness-105"
                                    >
                                        Tìm ngay
                                    </Link>
                                </div>
                            </div>

                            {/* Value Props */}
                            <div className="overflow-hidden rounded-[32px] border border-sky-100 bg-white p-8 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Why FindRoom</p>
                                        <h2 className="mt-1 text-2xl font-black text-slate-900">Trải nghiệm tìm phòng cao cấp</h2>
                                    </div>
                                    <ShieldCheck className="h-8 w-8 text-[#0EA5E9]" />
                                </div>

                                <div className="mt-6 space-y-4">
                                    {valueProps.map((item, i) => (
                                        <div
                                            key={i}
                                            className="rounded-2xl border border-sky-100 bg-sky-50 p-5"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0EA5E9] shadow-sm">
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                                                    <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest Posts */}
            <section className="px-4 py-16 bg-white">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mới cập nhật</p>
                            <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Tin đăng mới nhất</h2>
                        </div>

                        <Link
                            href="/rooms"
                            className="flex items-center gap-2 text-[#0EA5E9] font-bold hover:text-sky-600"
                        >
                            Xem tất cả <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {!posts.length ? (
                        <div className="mt-12 rounded-3xl border border-sky-100 bg-white p-16 text-center">
                            <Building2 className="mx-auto h-16 w-16 text-slate-300" />
                            <p className="mt-4 text-slate-500">Hiện chưa có tin đăng nào</p>
                        </div>
                    ) : (
                        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {posts.map((post) => (
                                <Link
                                    key={post.post_id}
                                    href={`/rooms/${post.post_id}`}
                                    className="block transition hover:-translate-y-1"
                                >
                                    <PostCard post={post} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Popular Areas */}
            <section className="px-4 py-16">
                <div className="mx-auto max-w-7xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Khu vực nổi bật</p>
                    <h2 className="mt-2 text-4xl font-black text-slate-900">Chọn khu vực bạn muốn ở</h2>

                    <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {areas.map((area) => (
                            <Link
                                key={area.name}
                                href={`/rooms?search=${encodeURIComponent(area.name)}`}
                                className="group rounded-3xl border border-sky-100 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="text-5xl">{area.icon}</div>
                                <div className="mt-6 text-2xl font-bold text-slate-900">{area.name}</div>
                                <p className="mt-2 text-slate-600">{area.hint}</p>
                                <div className="mt-6 flex items-center gap-2 text-[#0EA5E9] font-medium">
                                    Khám phá ngay
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-4 pb-20 pt-8">
                <div className="mx-auto max-w-4xl rounded-[40px] border border-sky-100 bg-white px-8 py-16 text-center shadow-2xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#0EA5E9]">DÀNH CHO CHỦ TRỌ</p>
                    <h2 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">
                        Bạn có phòng cần cho thuê?
                    </h2>
                    <p className="mx-auto mt-5 max-w-lg text-lg text-slate-600">
                        Đăng tin ngay hôm nay để tiếp cận người thuê phù hợp với giao diện chuyên nghiệp.
                    </p>

                    <Link
                        href="/post"
                        className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] px-10 py-4 text-lg font-black text-white shadow-xl shadow-sky-300 transition hover:scale-105"
                    >
                        Đăng tin cho thuê ngay
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}