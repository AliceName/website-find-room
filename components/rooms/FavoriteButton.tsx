"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FavoriteButtonProps {
    postId: string;
}

export default function FavoriteButton({ postId }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) checkFavorite(user.id);
        });
    }, [postId]);

    const checkFavorite = async (userId: string) => {
        const { data } = await supabase
            .from("favorites")
            .select("favority_id")
            .eq("user_id", userId)
            .eq("post_id", postId)
            .maybeSingle();
        setIsFavorite(!!data);
    };

    const toggleFavorite = async () => {
        if (!user) {
            window.location.href = "/auth/login";
            return;
        }

        setLoading(true);
        try {
            if (isFavorite) {
                await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("post_id", postId);
                setIsFavorite(false);
            } else {
                await supabase
                    .from("favorites")
                    .insert({ user_id: user.id, post_id: postId });
                setIsFavorite(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 ${
                isFavorite
                    ? "border-red-400 bg-red-50 text-red-500 hover:bg-red-100"
                    : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-400"
            }`}
        >
            <span className="text-lg">{isFavorite ? "❤️" : "🤍"}</span>
            <span>{isFavorite ? "Đã lưu" : "Lưu tin"}</span>
        </button>
    );
}
