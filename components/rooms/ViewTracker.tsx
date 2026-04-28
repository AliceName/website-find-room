"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
    postId: string;
}

export default function ViewTracker({ postId }: ViewTrackerProps) {
    const hasTracked = useRef(false);

    useEffect(() => {
        if (!postId || hasTracked.current) return;

        hasTracked.current = true;

        const trackView = async () => {
            try {
                const res = await fetch(`/api/posts/${postId}/view`, {
                    method: "POST",
                });

                if (!res.ok) {
                    console.error("Lỗi theo dõi lượt xem:", await res.text());
                }
            } catch (err) {
                console.error("Lỗi theo dõi lượt xem:", err);
            }
        };

        trackView();
    }, [postId]);

    return null;
}
