'use client'

import { useState } from "react";
import Input from "@/components/common/Input";

export default function CommentInput({
    roomId,
    postId,
    onSubmit,
}: {
    roomId?: string;
    postId?: string;
    onSubmit?: (comment: string) => Promise<void> | void;
}) {
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const value = comment.trim();
        if (!value) {
            setError("Vui lòng nhập nội dung bình luận.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            if (onSubmit) {
                await onSubmit(value);
            }

            setComment("");
        } catch {
            setError("Không thể gửi bình luận lúc này.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <Input
                label="Bình luận"
                placeholder={roomId ? "Thêm bình luận cho phòng này..." : "Thêm bình luận..."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />

            {(roomId || postId) && (
                <p className="text-xs text-gray-400">
                    {roomId ? `room_id: ${roomId}` : `post_id: ${postId}`}
                </p>
            )}

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-60"
            >
                {loading ? "Đang gửi..." : "Gửi bình luận"}
            </button>
        </div>
    );
}
