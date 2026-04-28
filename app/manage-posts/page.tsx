"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Post {
    post_id: string;
    post_title: string;
    room_id: string | null;
    user_id: string | null;
    post_created_at: string | null;
    post_update_at: string | null;   // ← tên đúng theo schema
    view_count: number | null;
    rooms?: {
        room_status: boolean | null;
        room_price: number;
        room_area: number | null;
        locations: { city: string; district: string; ward: string } | null;
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
        const timer = setTimeout(() => { setSuccess(null); setError(null); }, 4000);
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
                        locations:location_id ( city, district, ward )
                    )
                `)
                .eq("user_id", user.id)
                .order("post_created_at", { ascending: false });

            if (error) throw error;
            setPosts(data as unknown as Post[] || []);
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
            setError(err.message || "Lỗi khi cập nhật trạng thái");
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
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Quản lý bài đăng</h1>
                        <p className="text-gray-500">
                            {loading ? "Đang tải..." : `${posts.length} bài đăng của bạn`}
                        </p>
                    </div>
                    <Link
                        href="/post"
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
                    >
                        + Tạo bài đăng mới
                    </Link>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-red-500 text-lg mt-0.5">⚠️</span>
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-emerald-600 text-lg mt-0.5">✅</span>
                        <p className="text-emerald-700 text-sm font-medium">{success}</p>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4">
                                <div className="flex-1 h-10 bg-gray-200 rounded" />
                                <div className="w-24 h-10 bg-gray-200 rounded" />
                                <div className="w-32 h-10 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                        <span className="text-6xl">📝</span>
                        <p className="text-gray-500 text-xl mt-4 mb-2 font-medium">Bạn chưa có bài đăng nào</p>
                        <p className="text-gray-400 text-sm mb-6">Tạo bài đăng đầu tiên để bắt đầu cho thuê phòng</p>
                        <Link
                            href="/post"
                            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white hover:bg-blue-700 transition-all"
                        >
                            + Tạo bài đăng đầu tiên
                        </Link>
                    </div>
                ) : (
                    /* Card layout thay vì table để mobile-friendly */
                    <div className="space-y-4">
                        {posts.map((post) => {
                            const isAvailable = post.rooms?.room_status !== false;
                            const location = post.rooms?.locations;
                            const locationText = location
                                ? [location.district, location.city].filter(Boolean).join(', ')
                                : '—';
                            const price = post.rooms?.room_price;
                            const priceText = price
                                ? (price >= 1_000_000 ? (price / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' triệu/tháng' : price.toLocaleString('vi-VN') + ' đ/tháng')
                                : '—';

                            return (
                                <div key={post.post_id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                                }`}>
                                                    {isAvailable ? "● Còn phòng" : "○ Hết phòng"}
                                                </span>
                                                {post.rooms?.room_area && (
                                                    <span className="text-xs text-gray-400 font-medium">📏 {post.rooms.room_area}m²</span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-base line-clamp-1 mb-1">{post.post_title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>📍 {locationText}</span>
                                                <span className="text-blue-600 font-bold">💰 {priceText}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                Đăng ngày {post.post_created_at ? new Date(post.post_created_at).toLocaleDateString('vi-VN') : '—'}
                                                {post.post_update_at && ` · Cập nhật ${new Date(post.post_update_at).toLocaleDateString('vi-VN')}`}
                                                {' · '}👁️ {(post.view_count ?? 0).toLocaleString('vi-VN')} lượt xem
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* View */}
                                            <Link
                                                href={`/rooms/${post.post_id}`}
                                                className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all"
                                                title="Xem bài đăng"
                                            >
                                                👁️
                                            </Link>

                                            {/* Toggle status */}
                                            <button
                                                onClick={() => toggleRoomStatus(post)}
                                                disabled={togglingStatus === post.post_id}
                                                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                                                    isAvailable
                                                        ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                                        : "bg-green-100 text-green-600 hover:bg-green-200"
                                                }`}
                                                title={isAvailable ? "Đánh dấu hết phòng" : "Đánh dấu còn phòng"}
                                            >
                                                {togglingStatus === post.post_id ? "..." : (isAvailable ? "Hết phòng" : "Còn phòng")}
                                            </button>

                                            {/* Edit */}
                                            <Link
                                                href={`/post/edit/${post.post_id}`}
                                                className="inline-flex items-center justify-center rounded-lg bg-blue-100 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-200 transition-all"
                                            >
                                                ✏️ Sửa
                                            </Link>

                                            {/* Delete */}
                                            <button
                                                onClick={() => setDeleteConfirm(post.post_id)}
                                                className="inline-flex items-center justify-center rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-200 transition-all"
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
                        <span className="text-5xl">🗑️</span>
                        <h3 className="text-xl font-black text-gray-900 mt-4 mb-2">Xóa bài đăng?</h3>
                        <p className="text-gray-500 text-sm mb-8">
                            Hành động này sẽ xóa toàn bộ dữ liệu liên quan bao gồm phòng, ảnh, tiện ích và đánh giá. Không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition-all"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
