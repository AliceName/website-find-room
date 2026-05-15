"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";
import { Heart, Sparkles, ArrowRight } from "lucide-react";

interface FavoritePost {
    favority_id: string;
    post_id: string | null;
    posts: {
        post_id: string;
        post_title: string;
        post_created_at: string | null;
        view_count: number | null;
        rooms: {
            room_id: string;
            room_price: number;
            room_area: number | null;
            room_status: boolean | null;
            vr_url: string | null;
            room_types: {
                room_type_id: string;
                room_type_name: string;
            } | null;
            roomimages: {
                image_url: string;
                is_360: boolean | null;
            }[];
            locations: {
                location_id: string;
                city: string;
                district: string;
                ward: string;
            } | null;
        } | null;
    } | null;
}

export default function FavoritesPage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [favorites, setFavorites] = useState<FavoritePost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (!user) router.push("/auth/login");
        });
    }, [router]);

    const fetchFavorites = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("favorites")
            .select(`
                favority_id,
                post_id,
                posts:post_id (
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
                )
            `)
            .eq("user_id", user.id)
            .order("favority_created_at", { ascending: false });

        if (data) setFavorites(data as unknown as FavoritePost[]);
        setLoading(false);
    };

    useEffect(() => {
        if (!user) return;
        fetchFavorites();
    }, [user]);

    const removeFavorite = async (favorityId: string) => {
        await supabase.from("favorites").delete().eq("favority_id", favorityId);
        setFavorites((prev) => prev.filter((f) => f.favority_id !== favorityId));
    };

    if (!user) return null;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F0F9FF] text-slate-800">
            {/* BACKGROUND */}
            <div className="fixed inset-0 -z-10">
                {/* Subtle dot/grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.4]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                {/* Soft ambient glows */}
                <div className="absolute left-[-120px] top-[-120px] h-[460px] w-[460px] rounded-full bg-[#7DD3FC]/60 blur-[120px]" />
                <div className="absolute bottom-[-140px] right-[-100px] h-[420px] w-[420px] rounded-full bg-[#0EA5E9]/30 blur-[110px]" />
                <div className="absolute inset-0 bg-[#F0F9FF]/70" />
            </div>

            <div className="mx-auto max-w-7xl px-4 pb-14 pt-24">
                {/* HEADER */}
                <div className="mb-10 overflow-hidden rounded-[28px] border border-sky-100 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0EA5E9]">
                                <Sparkles className="h-4 w-4" />
                                Saved Rooms
                            </div>

                            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                                Danh sách
                                <span className="block bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] bg-clip-text text-transparent">
                                    phòng yêu thích
                                </span>
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                                Lưu lại những bài đăng phù hợp để xem lại nhanh hơn
                                và dễ dàng so sánh trước khi thuê.
                            </p>
                        </div>

                        {/* Counter badge */}
                        <div className="rounded-2xl border border-sky-100 bg-white px-6 py-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] shadow-[0_8px_24px_rgba(14,165,233,0.35)]">
                                    <Heart className="h-7 w-7 text-white" />
                                </div>

                                <div>
                                    <p className="text-3xl font-black text-slate-900">
                                        {loading ? "..." : favorites.length}
                                    </p>
                                    <p className="text-sm text-slate-500">Tin đã lưu</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOADING */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="overflow-hidden rounded-[24px] border border-sky-100 bg-white animate-pulse shadow-sm"
                            >
                                <div className="aspect-[4/3] bg-sky-50" />
                                <div className="space-y-4 p-5">
                                    <div className="h-5 w-3/4 rounded-lg bg-sky-100" />
                                    <div className="h-4 w-1/2 rounded-lg bg-sky-100" />
                                    <div className="h-4 w-1/3 rounded-lg bg-sky-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-white px-6 py-20 text-center shadow-sm">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-sky-100 bg-sky-50">
                            <Heart className="h-12 w-12 text-[#0EA5E9]" />
                        </div>

                        <h2 className="mt-8 text-3xl font-black text-slate-900">
                            Chưa có phòng yêu thích
                        </h2>

                        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
                            Hãy khám phá các phòng trọ hiện đại và lưu lại
                            những bài đăng phù hợp để xem lại bất cứ lúc nào.
                        </p>

                        <Link
                            href="/rooms"
                            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] px-8 py-4 text-sm font-black text-white shadow-[0_8px_32px_rgba(14,165,233,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(14,165,233,0.4)]"
                        >
                            Khám phá phòng
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    /* GRID */
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {favorites.map(
                            (fav) =>
                                fav.posts && (
                                    <div key={fav.favority_id} className="group relative">
                                        <Link
                                            href={`/rooms/${fav.posts.post_id}`}
                                            className="block transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(14,165,233,0.15)]"
                                        >
                                            <PostCard post={fav.posts as any} />
                                        </Link>

                                        {/* REMOVE BUTTON */}
                                        <button
                                            onClick={() => removeFavorite(fav.favority_id)}
                                            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-white text-slate-400 shadow-sm backdrop-blur-xl transition-all hover:scale-110 hover:border-red-200 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            title="Xóa khỏi yêu thích"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}