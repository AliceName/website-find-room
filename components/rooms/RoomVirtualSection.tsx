"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxOrientation, setLightboxOrientation] = useState<"landscape" | "portrait">("landscape");
  const maxThumbStart = Math.max(0, mediaItems.length - THUMBS_PER_VIEW);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, mediaItems.length - 1));
  const safeThumbStartIndex = Math.min(thumbStartIndex, maxThumbStart);
  const currentThumbs = mediaItems.slice(safeThumbStartIndex, safeThumbStartIndex + THUMBS_PER_VIEW);
  const activeItem = mediaItems[safeActiveIndex] ?? null;
  const lightboxItem = lightboxIndex !== null ? mediaItems[lightboxIndex] ?? null : null;

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((prev) => {
          if (prev === null) return prev;
          return prev > 0 ? prev - 1 : mediaItems.length - 1;
        });
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((prev) => {
          if (prev === null) return prev;
          return prev < mediaItems.length - 1 ? prev + 1 : 0;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    const current = mediaItems[lightboxIndex];
    setLightboxOrientation(current?.kind === "normal" && current.url ? "landscape" : "portrait");

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, mediaItems]);

  if (!activeItem) return null;

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[2rem] border border-app bg-slate-50 shadow-sm transition-all duration-[220ms] ease-[var(--ease-out-quart)]">
        {activeItem.kind === "normal" ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(safeActiveIndex)}
            className="group relative block aspect-[16/10] w-full cursor-zoom-in bg-gray-100 text-left"
            aria-label="Phóng to ảnh chính"
          >
            <Image
              src={activeItem.url}
              alt="Ảnh chính của phòng"
              fill
              sizes="(max-width: 1024px) 100vw, 65vw"
              loading="eager"
              className="object-cover transition-transform duration-[420ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              Click để phóng to
            </span>
          </button>
        ) : (
          <div className="overflow-hidden rounded-[2rem] bg-white transition-opacity duration-[220ms] ease-[var(--ease-out-quart)]">
            <VirtualTourViewer url={activeItem.url} />
          </div>
        )}
      </div>

      {mediaItems.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Chọn ảnh hiển thị
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setThumbStartIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeThumbStartIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:scale-[1.02] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Ảnh 360 trước"
            >
              ←
            </button>

            <div className="flex flex-1 gap-3 overflow-hidden">
              {currentThumbs.map((_, index) => {
                const realIndex = safeThumbStartIndex + index;
                const selected = realIndex === safeActiveIndex;
                const item = mediaItems[realIndex];
                return (
                  <button
                    key={`${item.url}-${realIndex}`}
                    type="button"
                    onClick={() => setActiveIndex(realIndex)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:shadow-sm ${selected
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-white hover:border-blue-300"
                      }`}
                    title={`Xem media #${realIndex + 1}`}
                  >
                    {item.kind === "external" ? (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <span className="text-2xl">🗺️</span>
                      </div>
                    ) : (
                      <Image
                        src={item.url}
                        alt={`Ảnh ${realIndex + 1}`}
                        fill
                        sizes="112px"
                        loading="lazy"
                        className="object-cover transition-transform duration-[420ms] ease-[var(--ease-out-quart)]"
                      />
                    )}
                    {selected && (
                      <span className="absolute left-1 top-1 rounded-lg bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                        Đang xem
                      </span>
                    )}
                    <span className={`absolute bottom-1 left-1 rounded-lg px-1.5 py-0.5 text-[9px] font-black text-white ${item.kind === "normal"
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:scale-[1.02] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Ảnh 360 tiếp theo"
            >
              →
            </button>
          </div>
        </div>
      )}

      {lightboxItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh phóng to"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative flex h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white/80">
              <div className="text-sm font-medium">
                {lightboxItem.kind === "normal" ? "Ảnh thường" : lightboxItem.kind === "panorama" ? "Ảnh 360°" : "Tour"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  aria-label="Đóng ảnh phóng to"
                >
                  Đóng
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex((prev) => (prev === null ? prev : prev > 0 ? prev - 1 : mediaItems.length - 1))}
              className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl font-bold text-white transition hover:bg-black/75 sm:left-4"
              aria-label="Ảnh trước"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setLightboxIndex((prev) => (prev === null ? prev : prev < mediaItems.length - 1 ? prev + 1 : 0))}
              className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl font-bold text-white transition hover:bg-black/75 sm:right-4"
              aria-label="Ảnh tiếp theo"
            >
              →
            </button>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-0">
              {lightboxItem.kind === "normal" ? (
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src={lightboxItem.url}
                    alt="Ảnh phóng to của phòng"
                    fill
                    sizes="100vw"
                    priority
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-full w-full overflow-hidden rounded-[1.5rem] bg-white">
                  <VirtualTourViewer url={lightboxItem.url} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
