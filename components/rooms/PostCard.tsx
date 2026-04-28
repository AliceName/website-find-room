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
<<<<<<< HEAD
        <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer">
            {/* KHU VỰC HÌNH ẢNH */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                {thumbnail !== '/placeholder-room.jpg' ? (
=======
        <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-app bg-surface shadow-sm transition-all duration-[220ms] ease-[var(--ease-out-quart)] hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20">
            {/* Hình ảnh */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                {thumbnail !== "/placeholder-room.jpg" ? (
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                    <Image
                        src={thumbnail}
                        alt={post.post_title}
                        fill
<<<<<<< HEAD
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
=======
                        sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[420ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-muted">
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                        <span className="text-5xl">🏠</span>
                    </div>
                )}

                {/* Badge trái */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    {post.rooms?.room_types && (
<<<<<<< HEAD
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                            {post.rooms.room_types.room_type_name}
                        </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase backdrop-blur-sm ${
                        isAvailable
                            ? 'bg-green-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                    }`}>
                        {isAvailable ? 'Còn phòng' : 'Hết phòng'}
=======
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
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                    </span>
                </div>

                {/* Badge VR */}
                {hasVR && (
<<<<<<< HEAD
                    <div className="absolute top-3 right-3">
                        <span className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
=======
                    <div className="absolute right-3 top-3">
                        <span className="flex items-center gap-1 rounded-lg bg-purple-600/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                            <span>🥽</span> VR
                        </span>
                    </div>
                )}
            </div>

<<<<<<< HEAD
            {/* KHU VỰC NỘI DUNG */}
            <div className="p-5 flex flex-col flex-grow space-y-3">
                <h3 className="font-bold text-gray-800 text-base line-clamp-2 leading-tight min-h-[2.8rem]">
                    {post.post_title}
                </h3>

                <div className="flex items-center gap-4 text-gray-500 text-sm">
=======
            {/* Nội dung */}
            <div className="flex flex-grow flex-col space-y-3 p-5">
                <h3 className="min-h-[2.8rem] line-clamp-2 text-base font-bold leading-tight text-slate-800 group-hover:text-slate-950">
                    {post.post_title}
                </h3>

                {/* Thông tin */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
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

<<<<<<< HEAD
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Giá thuê/tháng</p>
                        <p className="text-blue-600 font-black text-xl">
=======
                {/* Giá */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">
                            Giá thuê/tháng
                        </p>

                        <p className="text-xl font-black text-accent-app">
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                            {formattedPrice}
                        </p>
                    </div>

<<<<<<< HEAD
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
=======
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
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}