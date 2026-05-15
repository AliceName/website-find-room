"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
    Plus,
    Eye,
    Pencil,
    Trash2,
    Loader2,
    MapPin,
    Sparkles,
    ArrowRight,
    Clock3,
    Waves,
    Building2,
} from "lucide-react";

interface Post {
    post_id: string;
    post_title: string;
    room_id: string | null;
    user_id: string | null;
    post_created_at: string | null;
    post_update_at: string | null;
    view_count: number | null;
    rooms?: {
        room_status: boolean | null;
        room_price: number;
        room_area: number | null;
        locations: {
            city: string;
            district: string;
            ward: string;
        } | null;
    } | null;
}

export default function ManagePostsPage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (!user) router.push("/auth/login");
        });
    }, [router]);

    useEffect(() => {
        if (!user) return;
        fetchUserPosts();
    }, [user]);

    useEffect(() => {
        if (!success && !error) return;
        const timer = setTimeout(() => {
            setSuccess(null);
            setError(null);
        }, 4000);
        return () => clearTimeout(timer);
    }, [success, error]);

    const fetchUserPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("posts")
                .select(`
                    post_id,
                    post_title,
                    room_id,
                    user_id,
                    post_created_at,
                    post_update_at,
                    view_count,
                    rooms:room_id (
                        room_status,
                        room_price,
                        room_area,
                        locations:location_id (
                            city,
                            district,
                            ward
                        )
                    )
                `)
                .eq("user_id", user.id)
                .order("post_created_at", { ascending: false });

            if (error) throw error;
            setPosts((data as unknown as Post[]) || []);
        } catch (err: any) {
            setError(err.message || "Lỗi khi tải bài đăng");
        } finally {
            setLoading(false);
        }
    };

    const toggleRoomStatus = async (post: Post) => {
        if (!post.room_id) return;
        setTogglingStatus(post.post_id);
        try {
            const newStatus = !post.rooms?.room_status;
            const { error } = await supabase
                .from("rooms")
                .update({ room_status: newStatus })
                .eq("room_id", post.room_id)
                .eq("owner_id", user.id);
            if (error) throw error;
            setSuccess(newStatus ? "Đã cập nhật: Còn phòng" : "Đã cập nhật: Hết phòng");
            fetchUserPosts();
        } catch (err: any) {
            setError(err.message || "Lỗi cập nhật trạng thái");
        } finally {
            setTogglingStatus(null);
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            const { data: post, error: fetchErr } = await supabase
                .from("posts")
                .select("post_id, room_id, user_id")
                .eq("post_id", postId)
                .single();

            if (fetchErr || !post) { setError("Không tìm thấy bài đăng"); return; }
            if (post.user_id !== user.id) { setError("Bạn không có quyền xóa bài đăng này"); return; }

            if (post.room_id) {
                await supabase.from("reviews").delete().eq("room_id", post.room_id);
                await supabase.from("roomimages").delete().eq("room_id", post.room_id);
                await supabase.from("roomamenities").delete().eq("room_id", post.room_id);
            }

            await supabase.from("favorites").delete().eq("post_id", postId);

            const { error: postErr } = await supabase
                .from("posts")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", user.id);

            if (postErr) throw new Error("Lỗi xóa bài đăng: " + postErr.message);

            if (post.room_id) {
                await supabase.from("rooms").delete().eq("room_id", post.room_id).eq("owner_id", user.id);
            }

            setSuccess("Xóa bài đăng thành công!");
            setDeleteConfirm(null);
            fetchUserPosts();
        } catch (err: any) {
            setError(err.message || "Lỗi khi xóa bài đăng");
        }
    };

    if (!user) return null;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-4 pb-16 pt-28 text-slate-800">
            {/* BACKGROUND */}
            <div className="fixed inset-0 -z-10">
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.4]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                {/* Soft radial glows */}
                <div className="absolute left-[-80px] top-[-80px] h-[400px] w-[400px] rounded-full bg-sky-200/60 blur-[100px]" />
                <div className="absolute bottom-[-80px] right-[-80px] h-[350px] w-[350px] rounded-full bg-cyan-200/50 blur-[100px]" />
                <div className="absolute inset-0 bg-[#F8FAFC]/60" />
            </div>

            <div className="mx-auto max-w-7xl">
                {/* HEADER */}
                <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-600">
                            <Sparkles className="h-4 w-4" />
                            Dashboard quản lý
                        </div>

                        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
                            Quản lý bài đăng
                        </h1>

                        <p className="mt-3 text-sm text-slate-500 md:text-base">
                            {loading
                                ? "Đang tải dữ liệu..."
                                : `${posts.length} bài đăng đang được quản lý`}
                        </p>
                    </div>

                    <Link
                        href="/post"
                        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] px-7 py-4 text-sm font-black text-white shadow-[0_8px_32px_rgba(14,165,233,0.30)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(14,165,233,0.40)]"
                    >
                        <Plus className="h-5 w-5" />
                        Tạo bài đăng mới
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* ALERTS */}
                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                        <p className="text-sm font-medium text-red-600">⚠️ {error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-sm font-medium text-emerald-600">✅ {success}</p>
                    </div>
                )}

                {/* LOADING */}
                {loading ? (
                    <div className="space-y-5">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="animate-pulse rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <div className="h-5 w-1/3 rounded-lg bg-slate-100" />
                                <div className="mt-4 h-4 w-2/3 rounded-lg bg-slate-100" />
                                <div className="mt-6 h-10 rounded-lg bg-slate-100" />
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    /* EMPTY */
                    <div className="rounded-[28px] border border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
                        <Building2 className="mx-auto h-16 w-16 text-slate-300" />

                        <h3 className="mt-6 text-2xl font-black text-slate-800">
                            Chưa có bài đăng nào
                        </h3>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                            Tạo bài đăng đầu tiên để bắt đầu tiếp cận người thuê
                            với giao diện hiện đại và VR 360°.
                        </p>

                        <Link
                            href="/post"
                            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] px-8 py-4 text-sm font-black text-white shadow-[0_8px_32px_rgba(14,165,233,0.25)] transition-all hover:scale-[1.02]"
                        >
                            <Plus className="h-5 w-5" />
                            Tạo bài đăng đầu tiên
                        </Link>
                    </div>
                ) : (
                    /* POSTS */
                    <div className="space-y-4">
                        {posts.map((post) => {
                            const isAvailable = post.rooms?.room_status !== false;
                            const location = post.rooms?.locations;
                            const locationText = location
                                ? [location.district, location.city].filter(Boolean).join(", ")
                                : "—";
                            const price = post.rooms?.room_price;
                            const priceText = price
                                ? price >= 1_000_000
                                    ? `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")} triệu/tháng`
                                    : `${price.toLocaleString("vi-VN")} đ/tháng`
                                : "—";

                            return (
                                <div
                                    key={post.post_id}
                                    className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-sky-300 hover:shadow-[0_4px_24px_rgba(14,165,233,0.12)]"
                                >
                                    {/* Subtle left accent bar */}
                                    <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-[24px] bg-gradient-to-b from-[#0EA5E9] to-[#22D3EE] opacity-0 transition-opacity group-hover:opacity-100" />

                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                                        {/* LEFT */}
                                        <div className="flex-1">
                                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                                        isAvailable
                                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                                    }`}
                                                >
                                                    {isAvailable ? "● Còn phòng" : "○ Hết phòng"}
                                                </span>

                                                {post.rooms?.room_area && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 border border-slate-200 rounded-full px-3 py-1">
                                                        <Waves className="h-3.5 w-3.5" />
                                                        {post.rooms.room_area}m²
                                                    </span>
                                                )}
                                            </div>

                                            <h2 className="text-xl font-black text-slate-900 md:text-2xl">
                                                {post.post_title}
                                            </h2>

                                            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <MapPin className="h-4 w-4 text-[#0EA5E9]" />
                                                    {locationText}
                                                </div>

                                                <div className="font-bold text-[#0EA5E9]">
                                                    💰 {priceText}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    {post.post_created_at
                                                        ? new Date(post.post_created_at).toLocaleDateString("vi-VN")
                                                        : "—"}
                                                </span>

                                                <span>
                                                    👁️ {(post.view_count ?? 0).toLocaleString("vi-VN")} lượt xem
                                                </span>
                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Link
                                                href={`/rooms/${post.post_id}`}
                                                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:border-slate-300"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>

                                            <button
                                                onClick={() => toggleRoomStatus(post)}
                                                disabled={togglingStatus === post.post_id}
                                                className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold border transition-all ${
                                                    isAvailable
                                                        ? "bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                                }`}
                                            >
                                                {togglingStatus === post.post_id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : isAvailable ? (
                                                    "Hết phòng"
                                                ) : (
                                                    "Còn phòng"
                                                )}
                                            </button>

                                            <Link
                                                href={`/post/edit/${post.post_id}`}
                                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 text-sm font-bold text-[#0EA5E9] transition-all hover:bg-sky-100"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Sửa
                                            </Link>

                                            <button
                                                onClick={() => setDeleteConfirm(post.post_id)}
                                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-500 transition-all hover:bg-red-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* DELETE MODAL */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.15)]">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-100">
                            <Trash2 className="h-10 w-10" />
                        </div>

                        <h3 className="mt-6 text-3xl font-black text-slate-900">
                            Xóa bài đăng?
                        </h3>

                        <p className="mt-4 text-sm leading-7 text-slate-500">
                            Toàn bộ dữ liệu liên quan như ảnh, tiện ích và đánh
                            giá sẽ bị xóa vĩnh viễn.
                        </p>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100"
                            >
                                Hủy
                            </button>

                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-5 py-4 text-sm font-black text-white shadow-[0_4px_16px_rgba(239,68,68,0.30)] transition-all hover:scale-[1.02]"
                            >
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}