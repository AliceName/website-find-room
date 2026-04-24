"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";

interface FavoritePost {
    favority_id: string;
    post_id: string | null;
    posts: {
        post_id: string;
        post_title: string;
        post_created_at: string | null;
        rooms: {
            room_id: string;
            room_price: number;
            room_area: number | null;
            room_status: boolean | null;
            vr_url: string | null;
            room_types: { room_type_id: string; room_type_name: string } | null;
            roomimages: { image_url: string; is_360: boolean | null }[];
            locations: { location_id: string; city: string; district: string; ward: string } | null;
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
                    rooms:room_id (
                        room_id,
                        room_price,
                        room_area,
                        room_status,
                        vr_url,
                        room_types:room_type_id ( room_type_id, room_type_name ),
                        roomimages ( image_url, is_360 ),
                        locations:location_id ( location_id, city, district, ward )
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchFavorites();
    }, [user]);

    const removeFavorite = async (favorityId: string) => {
        await supabase.from("favorites").delete().eq("favority_id", favorityId);
        setFavorites(prev => prev.filter(f => f.favority_id !== favorityId));
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">❤️ Tin đã lưu</h1>
                    <p className="text-gray-500">
                        {loading ? "Đang tải..." : `${favorites.length} bài đăng đã lưu`}
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                                <div className="aspect-[4/3] bg-gray-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <span className="text-6xl">🤍</span>
                        <p className="text-gray-500 text-xl font-medium mt-4">Chưa có tin đăng nào được lưu</p>
                        <p className="text-gray-400 text-sm mt-2">Hãy khám phá các phòng trọ và lưu những tin ưng ý</p>
                        <Link
                            href="/rooms"
                            className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all"
                        >
                            Khám phá phòng trọ
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map(fav => fav.posts && (
                            <div key={fav.favority_id} className="relative group">
                                <Link href={`/rooms/${fav.posts.post_id}`}>
                                    <PostCard post={fav.posts as any} />
                                </Link>
                                <button
                                    onClick={() => removeFavorite(fav.favority_id)}
                                    className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-500 transition-all text-sm font-bold opacity-0 group-hover:opacity-100"
                                    title="Xóa khỏi danh sách yêu thích"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
