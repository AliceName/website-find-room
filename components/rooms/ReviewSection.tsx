"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Review {
    review_id: string;
    rating: number | null;
    comment: string | null;
    review_created_at: string | null;
    users: { user_name: string } | null;
}

interface ReviewSectionProps {
    roomId: string;
}

export default function ReviewSection({ roomId }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userReview, setUserReview] = useState<Review | null>(null);

    // Form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchReviews();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, [roomId]);

    const fetchReviews = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("reviews")
            .select(`
                review_id, rating, comment, review_created_at,
                users:user_id ( user_name )
            `)
            .eq("room_id", roomId)
            .order("review_created_at", { ascending: false });

        if (data) {
            setReviews(data as unknown as Review[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user && reviews.length > 0) {
            // Check if user already reviewed - we do a separate query
            checkUserReview();
        }
    }, [user, roomId]);

    const checkUserReview = async () => {
        if (!user) return;
        const { data } = await supabase
            .from("reviews")
            .select("review_id, rating, comment, review_created_at")
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (data) {
            setUserReview(data as any);
            setRating(data.rating || 5);
            setComment(data.comment || "");
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length)
        : 0;

    const handleSubmit = async () => {
        if (!user) {
            window.location.href = "/auth/login";
            return;
        }
        if (!comment.trim()) {
            setError("Vui lòng nhập nhận xét của bạn.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            if (userReview) {
                // Update
                const { error: err } = await supabase
                    .from("reviews")
                    .update({ rating, comment, review_updated_at: new Date().toISOString() })
                    .eq("review_id", userReview.review_id);
                if (err) throw err;
                setSuccess("Cập nhật đánh giá thành công!");
            } else {
                // Insert
                const { error: err } = await supabase
                    .from("reviews")
                    .insert({ user_id: user.id, room_id: roomId, rating, comment });
                if (err) throw err;
                setSuccess("Đăng đánh giá thành công!");
            }

            setShowForm(false);
            fetchReviews();
            checkUserReview();
        } catch (err: any) {
            setError(err.message || "Lỗi khi gửi đánh giá");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!userReview) return;
        if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

        await supabase.from("reviews").delete().eq("review_id", userReview.review_id);
        setUserReview(null);
        setRating(5);
        setComment("");
        fetchReviews();
    };

    const renderStars = (val: number, interactive = false) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={interactive ? () => setRating(star) : undefined}
                        className={`text-2xl transition-transform ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${
                            star <= val ? 'text-yellow-400' : 'text-gray-200'
                        }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    useEffect(() => {
        if (!success && !error) return;
        const t = setTimeout(() => { setSuccess(null); setError(null); }, 3000);
        return () => clearTimeout(t);
    }, [success, error]);

    return (
        <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <span className="w-2 h-8 bg-yellow-400 rounded-full" />
                    Đánh giá ({reviews.length})
                </h2>
                {reviews.length > 0 && (
                    <div className="text-center">
                        <div className="text-3xl font-black text-yellow-500">{avgRating.toFixed(1)}</div>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                                <span key={s} className={`text-sm ${s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                            ))}
                        </div>
                        <div className="text-xs text-gray-400">{reviews.length} đánh giá</div>
                    </div>
                )}
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-red-600 text-sm font-medium">
                    ⚠️ {error}
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-emerald-700 text-sm font-medium">
                    ✅ {success}
                </div>
            )}

            {/* Write Review Button */}
            {user && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full border-2 border-dashed border-yellow-300 bg-yellow-50 text-yellow-700 py-4 rounded-2xl font-bold text-sm hover:bg-yellow-100 transition-all"
                >
                    {userReview ? "✏️ Sửa đánh giá của bạn" : "✍️ Viết đánh giá"}
                </button>
            )}

            {!user && (
                <div className="text-center py-4 bg-gray-50 rounded-2xl">
                    <p className="text-gray-500 text-sm mb-3">Đăng nhập để viết đánh giá</p>
                    <a href="/auth/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all inline-block">
                        Đăng nhập
                    </a>
                </div>
            )}

            {/* Review Form */}
            {showForm && user && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6 space-y-4">
                    <h3 className="font-black text-gray-800">{userReview ? "Sửa đánh giá" : "Viết đánh giá"}</h3>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Đánh giá</label>
                        {renderStars(rating, true)}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nhận xét</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                            placeholder="Chia sẻ trải nghiệm của bạn về phòng này..."
                            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                        >
                            {submitting ? "Đang gửi..." : (userReview ? "Cập nhật" : "Gửi đánh giá")}
                        </button>
                        {userReview && (
                            <button
                                onClick={handleDelete}
                                className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <span className="text-4xl">💬</span>
                    <p className="mt-3 font-medium">Chưa có đánh giá nào</p>
                    <p className="text-sm">Hãy là người đầu tiên đánh giá phòng này!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.review_id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">
                                {(review.users?.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-bold text-gray-800 text-sm">{review.users?.user_name || 'Ẩn danh'}</span>
                                    <span className="text-xs text-gray-400">
                                        {review.review_created_at ? new Date(review.review_created_at).toLocaleDateString('vi-VN') : ''}
                                    </span>
                                </div>
                                <div className="flex gap-0.5 my-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className={`text-sm ${s <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                                    ))}
                                </div>
                                {review.comment && (
                                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
