"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
    postId: string;
    initialCount: number;
}

export default function LiveViewCount({ postId, initialCount }: Props) {
    const [count, setCount] = useState(initialCount);

    useEffect(() => {
        const refresh = async () => {
            const { data, error } = await supabase
                .from("posts")
                .select("view_count")
                .eq("post_id", postId)
                .single();

            if (!error && data?.view_count !== undefined && data.view_count !== null) {
                setCount(data.view_count);
            }
        };

        // Refetch sau 300ms để lấy số mới nhất sau khi ViewTracker gọi API
        const timer = setTimeout(refresh, 300);
        return () => clearTimeout(timer);
    }, [postId]);

    return <span>👁️ {count.toLocaleString("vi-VN")}</span>;
}
