"use client"
import { useMemo, useState } from 'react'
import Image from 'next/image'

interface RoomGalleryProps {
    images: { image_url: string }[];
}

const THUMBS_PER_VIEW = 5;

export default function RoomGallery({ images }: RoomGalleryProps) {
    const imageUrls = useMemo(
        () => Array.from(new Set(images.map((img) => img.image_url).filter(Boolean))),
        [images]
    );
    const [activeIndex, setActiveIndex] = useState(0);
    const [thumbStartIndex, setThumbStartIndex] = useState(0);

    if (imageUrls.length === 0) return null;

    const maxThumbStart = Math.max(0, imageUrls.length - THUMBS_PER_VIEW);
    const currentThumbs = imageUrls.slice(thumbStartIndex, thumbStartIndex + THUMBS_PER_VIEW);
    const activeImage = imageUrls[activeIndex];

    return (
        <section className="space-y-4">
            <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden border-4 border-white shadow-md group bg-gray-100">
                <Image
                    src={activeImage}
                    alt="Ảnh chính của phòng"
                    fill
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    loading="eager"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {imageUrls.length > 1 && (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setThumbStartIndex((prev) => Math.max(0, prev - 1))}
                        disabled={thumbStartIndex === 0}
                        className="h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        aria-label="Ảnh trước"
                    >
                        ←
                    </button>

                    <div className="flex gap-3 overflow-hidden flex-1">
                        {currentThumbs.map((url, index) => {
                            const realIndex = thumbStartIndex + index;
                            const selected = realIndex === activeIndex;
                            return (
                                <button
                                    key={`${url}-${realIndex}`}
                                    type="button"
                                    onClick={() => setActiveIndex(realIndex)}
                                    className={`relative h-20 w-28 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                                        selected
                                            ? "border-blue-500 ring-2 ring-blue-200"
                                            : "border-white hover:border-blue-300"
                                    }`}
                                    title={`Xem ảnh #${realIndex + 1}`}
                                >
                                    <Image
                                        src={url}
                                        alt={`Ảnh phòng ${realIndex + 1}`}
                                        fill
                                        sizes="112px"
                                        loading="lazy"
                                        className="object-cover"
                                    />
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setThumbStartIndex((prev) => Math.min(maxThumbStart, prev + 1))}
                        disabled={thumbStartIndex >= maxThumbStart}
                        className="h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        aria-label="Ảnh tiếp theo"
                    >
                        →
                    </button>
                </div>
            )}
        </section>
    );
}