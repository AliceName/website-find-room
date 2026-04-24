"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { VirtualTourViewer } from "@/components/common";

interface RoomVirtualSectionProps {
  normalImages: string[];
  vrImages: string[];
  externalVrUrl: string | null;
}

const THUMBS_PER_VIEW = 5;

type MediaItem = {
  url: string;
  kind: "normal" | "panorama" | "external";
};

export default function RoomVirtualSection({ normalImages, vrImages, externalVrUrl }: RoomVirtualSectionProps) {
  const mediaItems = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];

    for (const url of Array.from(new Set(vrImages.filter(Boolean)))) {
      items.push({ url, kind: "panorama" });
    }

    if (externalVrUrl && !items.some((item) => item.url === externalVrUrl)) {
      items.push({ url: externalVrUrl, kind: "external" });
    }

    for (const url of Array.from(new Set(normalImages.filter(Boolean)))) {
      if (!items.some((item) => item.url === url)) {
        items.push({ url, kind: "normal" });
      }
    }

    return items;
  }, [externalVrUrl, normalImages, vrImages]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbStartIndex, setThumbStartIndex] = useState(0);
  const maxThumbStart = Math.max(0, mediaItems.length - THUMBS_PER_VIEW);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, mediaItems.length - 1));
  const safeThumbStartIndex = Math.min(thumbStartIndex, maxThumbStart);
  const currentThumbs = mediaItems.slice(safeThumbStartIndex, safeThumbStartIndex + THUMBS_PER_VIEW);
  const activeItem = mediaItems[safeActiveIndex] ?? null;

  if (!activeItem) return null;

  return (
    <section className="space-y-4">
      {activeItem.kind === "normal" ? (
        <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden border-4 border-white shadow-md group bg-gray-100">
          <Image
            src={activeItem.url}
            alt="Ảnh chính của phòng"
            fill
            sizes="(max-width: 1024px) 100vw, 65vw"
            loading="eager"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <VirtualTourViewer url={activeItem.url} />
      )}

      {mediaItems.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
            Chọn ảnh hiển thị
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setThumbStartIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeThumbStartIndex === 0}
              className="h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              aria-label="Ảnh 360 trước"
            >
              ←
            </button>

            <div className="flex gap-3 overflow-hidden flex-1">
              {currentThumbs.map((url, index) => {
                const realIndex = safeThumbStartIndex + index;
                const selected = realIndex === safeActiveIndex;
                const item = mediaItems[realIndex];
                return (
                  <button
                    key={`${item.url}-${realIndex}`}
                    type="button"
                    onClick={() => setActiveIndex(realIndex)}
                    className={`relative w-28 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      selected
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-white hover:border-blue-300"
                    }`}
                    title={`Xem media #${realIndex + 1}`}
                  >
                    {item.kind === "external" ? (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        <span className="text-2xl">🗺️</span>
                      </div>
                    ) : (
                      <Image
                        src={item.url}
                        alt={`Ảnh ${realIndex + 1}`}
                        fill
                        sizes="112px"
                        loading="lazy"
                        className="object-cover"
                      />
                    )}
                    {selected && (
                      <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-lg bg-blue-600 text-white font-black">
                        Đang xem
                      </span>
                    )}
                    <span className={`absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded-lg font-black text-white ${
                      item.kind === "normal"
                        ? "bg-gray-700/90"
                        : item.kind === "panorama"
                          ? "bg-purple-600/90"
                          : "bg-blue-600/90"
                    }`}>
                      {item.kind === "normal" ? "Ảnh" : item.kind === "panorama" ? "360°" : "Tour"}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setThumbStartIndex((prev) => Math.min(maxThumbStart, prev + 1))}
              disabled={safeThumbStartIndex >= maxThumbStart}
              className="h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              aria-label="Ảnh 360 tiếp theo"
            >
              →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
