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
                        className={`text-2xl transition-all duration-[180ms] ease-[var(--ease-out-quart)] ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'} ${
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
        <section className="space-y-6 rounded-[2.5rem] border border-app bg-surface p-8 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="flex items-center gap-3 text-2xl font-black text-slate-950">
                        <span className="h-8 w-2 rounded-full bg-yellow-400" />
                        Đánh giá ({reviews.length})
                    </h2>
                    <p className="text-sm text-slate-500">Chia sẻ trải nghiệm thực tế của người thuê.</p>
                </div>
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
            <div className="grid grid-rows-[auto] transition-[grid-template-rows,opacity] duration-[220ms] ease-[var(--ease-out-quart)]">
                {error && (
                    <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50">
                        <div className="p-3 text-sm font-medium text-red-600">⚠️ {error}</div>
                    </div>
                )}
            </div>
            <div className={`overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 transition-all duration-[260ms] ease-[var(--ease-out-quart)] ${success ? 'opacity-100 translate-y-2' : 'max-h-0 opacity-0 -translate-y-2 border-0'}`}>
                {success && (
                    <div className="p-3 text-sm font-medium text-emerald-700">✅ {success}</div>
                )}
            </div>

            {/* Write Review Button */}
            {user && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50 py-4 text-sm font-bold text-yellow-700 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-yellow-100 active:scale-[0.99]"
                >
                    {userReview ? "✏️ Sửa đánh giá của bạn" : "✍️ Viết đánh giá"}
                </button>
            )}

            {!user && (
                <div className="rounded-2xl bg-gray-50 py-4 text-center">
                    <p className="mb-3 text-sm text-gray-500">Đăng nhập để viết đánh giá</p>
                    <a href="/auth/login" className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-blue-700">
                        Đăng nhập
                    </a>
                </div>
            )}

            {/* Review Form */}
            {showForm && user && (
                <div className="space-y-4 rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-6">
                    <h3 className="font-black text-slate-800">{userReview ? "Sửa đánh giá" : "Viết đánh giá"}</h3>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Đánh giá</label>
                        {renderStars(rating, true)}
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Nhận xét</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                            placeholder="Chia sẻ trải nghiệm của bạn về phòng này..."
                            className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus:outline-none focus:ring-4 focus:ring-yellow-400/20"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-600 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-gray-50 active:scale-[0.99]"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 rounded-xl bg-yellow-400 py-3 text-sm font-bold text-gray-900 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-yellow-500 disabled:opacity-50"
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                {submitting && (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/20 border-t-gray-900" />
                                )}
                                <span>{submitting ? "Đang gửi..." : (userReview ? "Cập nhật" : "Gửi đánh giá")}</span>
                            </span>
                        </button>
                        {userReview && (
                            <button
                                onClick={handleDelete}
                                className="rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-600 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-red-200 active:scale-[0.98]"
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
                        <div key={i} className="animate-pulse rounded-2xl bg-gray-50 p-4">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 py-8 text-center text-gray-400">
                    <span className="text-4xl">💬</span>
                    <p className="mt-3 font-medium">Chưa có đánh giá nào</p>
                    <p className="text-sm">Hãy là người đầu tiên đánh giá phòng này!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.review_id} className="flex gap-4 rounded-2xl bg-gray-50 p-4 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-black text-white">
                                {(review.users?.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-bold text-gray-800">{review.users?.user_name || 'Ẩn danh'}</span>
                                    <span className="text-xs text-gray-400">
                                        {review.review_created_at ? new Date(review.review_created_at).toLocaleDateString('vi-VN') : ''}
                                    </span>
                                </div>
                                <div className="my-1 flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className={`text-sm ${s <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                                    ))}
                                </div>
                                {review.comment && (
                                    <p className="text-sm leading-relaxed text-gray-600">{review.comment}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
