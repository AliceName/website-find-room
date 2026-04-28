"use client";

import Image from "next/image";
import { Database } from "@/types/supabase";
import LiveViewCount from "./LiveViewCount";
import { formatRelativeTime } from "@/lib/utils/date";

interface PostCardProps {
    post: Database["public"]["Tables"]["posts"]["Row"] & {
        rooms: (Database["public"]["Tables"]["rooms"]["Row"] & {
            room_types?: Database["public"]["Tables"]["roomtypes"]["Row"] | null;
            roomimages?: Database["public"]["Tables"]["roomimages"]["Row"][];
            locations?: Database["public"]["Tables"]["locations"]["Row"] | null;
        }) | null;
    };
}

export default function PostCard({ post }: PostCardProps) {
    const thumbnail =
        post.rooms?.roomimages?.[0]?.image_url || "/placeholder-room.jpg";

    const formattedPrice = post.rooms?.room_price
        ? post.rooms.room_price >= 1_000_000
            ? (post.rooms.room_price / 1_000_000)
                  .toFixed(1)
                  .replace(/\.0$/, "") + " triệu"
            : post.rooms.room_price.toLocaleString("vi-VN") + " đ"
        : "0";

    const isAvailable = post.rooms?.room_status !== false;

    const location = post.rooms?.locations;

    const locationText = location
        ? [location.district, location.city].filter(Boolean).join(", ")
        : "TP. Hồ Chí Minh";

    const hasVR = !!(
        post.rooms?.vr_url ||
        post.rooms?.roomimages?.some((img) => img.is_360)
    );

    return (
        <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-app bg-surface shadow-sm transition-all duration-[220ms] ease-[var(--ease-out-quart)] hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20">
            {/* Hình ảnh */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                {thumbnail !== "/placeholder-room.jpg" ? (
                    <Image
                        src={thumbnail}
                        alt={post.post_title}
                        fill
                        sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[420ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-muted">
                        <span className="text-5xl">🏠</span>
                    </div>
                )}

                {/* Badge trái */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    {post.rooms?.room_types && (
                        <span className="rounded-lg bg-accent-app/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            {post.rooms.room_types.room_type_name}
                        </span>
                    )}

                    <span
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase text-white backdrop-blur-sm ${
                            isAvailable
                                ? "bg-green-500/90"
                                : "bg-red-500/90"
                        }`}
                    >
                        {isAvailable ? "Còn phòng" : "Hết phòng"}
                    </span>
                </div>

                {/* Badge VR */}
                {hasVR && (
                    <div className="absolute right-3 top-3">
                        <span className="flex items-center gap-1 rounded-lg bg-purple-600/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                            <span>🥽</span> VR
                        </span>
                    </div>
                )}
            </div>

            {/* Nội dung */}
            <div className="flex flex-grow flex-col space-y-3 p-5">
                <h3 className="min-h-[2.8rem] line-clamp-2 text-base font-bold leading-tight text-slate-800 group-hover:text-slate-950">
                    {post.post_title}
                </h3>

                {/* Thông tin */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <span>📏</span>
                        <span className="font-medium">
                            {post.rooms?.room_area || 0} m²
                        </span>
                    </div>

                    <div className="min-w-0 flex items-center gap-1">
                        <span>📍</span>
                        <span className="truncate text-xs">
                            {locationText}
                        </span>
                    </div>

                    {post.post_created_at && (
                        <div className="min-w-0 flex items-center gap-1">
                            <span>🕒</span>
                            <span className="truncate text-xs">
                                {formatRelativeTime(post.post_created_at)}
                            </span>
                        </div>
                    )}

                    <div className="min-w-0 flex items-center gap-1">
                        <LiveViewCount
                            postId={post.post_id}
                            initialCount={post.view_count ?? 0}
                        />
                    </div>
                </div>

                {/* Giá */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">
                            Giá thuê/tháng
                        </p>

                        <p className="text-xl font-black text-accent-app">
                            {formattedPrice}
                        </p>
                    </div>

                    <div className="rounded-xl bg-surface-muted p-2 text-accent-app transition-all group-hover:bg-accent-app group-hover:text-white">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="h-5 w-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m8.25 4.5 7.5 7.5-7.5 7.5"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}