"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface VirtualTourViewerProps {
  url: string | null;
  className?: string;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

function isPanoramaImageUrl(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));
}

/**
 * Converts various URL formats to embeddable format
 * Supports: Google Maps Embed API, Street View, Matterport, YouTube 360
 */
function convertToEmbeddableUrl(url: string): { embeddableUrl: string | null; type: string } {
  if (!url) return { embeddableUrl: null, type: "none" };

  // Equirectangular images uploaded directly (JPG/PNG/WebP...)
  if (isPanoramaImageUrl(url)) {
    return { embeddableUrl: url, type: "panorama-image" };
  }

  // Google Maps Embed API format (preferred)
  if (url.includes("google.com/maps/embed")) {
    return { embeddableUrl: url, type: "google-embed" };
  }

  // Regular Google Maps URLs - these cannot be embedded due to CORS
  if (url.includes("google.com/maps") || url.includes("maps.google.com")) {
    console.warn("Google Maps sharing URL detected. For best results, use Google Maps Embed API URL instead.");
    return { embeddableUrl: null, type: "google-maps-sharing" };
  }

  // Matterport URLs
  if (url.includes("matterport.com")) {
    if (url.includes("/show/")) {
      const idMatch = url.match(/\/show\/([a-zA-Z0-9]+)/);
      if (idMatch && idMatch[1]) {
        return { embeddableUrl: `https://my.matterport.com/show/?m=${idMatch[1]}`, type: "matterport" };
      }
    }
    return { embeddableUrl: url, type: "matterport" };
  }

  // YouTube 360 Videos
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      return { embeddableUrl: `https://www.youtube.com/embed/${videoIdMatch[1]}?rel=0`, type: "youtube" };
    }
  }

  // If URL is already an embed or iframe URL, use as-is
  if (url.includes("/embed") || url.includes("iframe") || url.startsWith("https://")) {
    return { embeddableUrl: url, type: "other-embed" };
  }

  return { embeddableUrl: null, type: "unsupported" };
}

function getHelpText(type: string): string {
  switch (type) {
    case "google-maps-sharing":
      return "Để nhúng Google Maps, hãy dùng URL Embed API. Vào Google Maps > chia sẻ > Nhúng bản đồ > sao chép iframe URL";
    case "panorama-load-error":
      return "Không thể tải ảnh 360°. Vui lòng kiểm tra URL ảnh còn hoạt động và ảnh là dạng panorama phẳng.";
    case "unsupported":
      return "Định dạng URL không được hỗ trợ. Vui lòng sử dụng: ảnh 360 phẳng (JPG/PNG/WebP), Google Maps Embed, Matterport hoặc YouTube 360°";
    default:
      return "";
  }
}

export function VirtualTourViewer({ url, className = "" }: VirtualTourViewerProps) {
  const [showError, setShowError] = useState(false);
  const [panoramaError, setPanoramaError] = useState<string | null>(null);
  const panoramaContainerRef = useRef<HTMLDivElement | null>(null);
  const panoramaViewerRef = useRef<{ destroy: () => void } | null>(null);
  const { embeddableUrl, type } = useMemo(() => convertToEmbeddableUrl(url || ""), [url]);

  useEffect(() => {
    let cancelled = false;

    if (type !== "panorama-image" || !embeddableUrl || !panoramaContainerRef.current) {
      return () => {
        if (panoramaViewerRef.current) {
          panoramaViewerRef.current.destroy();
          panoramaViewerRef.current = null;
        }
      };
    }

    const initPanorama = async () => {
      try {
        const { Viewer } = await import("@photo-sphere-viewer/core");
        if (cancelled || !panoramaContainerRef.current) return;

        if (panoramaViewerRef.current) {
          panoramaViewerRef.current.destroy();
        }

        const viewer = new Viewer({
          container: panoramaContainerRef.current,
          panorama: embeddableUrl,
          navbar: false,
          mousewheel: true,
          touchmoveTwoFingers: false,
          defaultZoomLvl: 20,
        });

        panoramaViewerRef.current = viewer;
        setPanoramaError(null);
      } catch (error) {
        console.error("Panorama load error", error);
        setPanoramaError(getHelpText("panorama-load-error"));
      }
    };

    initPanorama();

    return () => {
      cancelled = true;
      if (panoramaViewerRef.current) {
        panoramaViewerRef.current.destroy();
        panoramaViewerRef.current = null;
      }
    };
  }, [embeddableUrl, type]);

  // Handle iframe errors
  const handleIframeError = () => {
    setShowError(true);
  };

  if (!embeddableUrl) {
    return (
      <div className={`relative rounded-[3rem] overflow-hidden bg-gray-100 border-8 border-white shadow-2xl h-[400px] md:h-[550px] flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4 px-6">
          <span className="text-6xl block">🗺️</span>
          <h3 className="text-lg font-bold text-gray-700">Không thể tải tour ảo</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {getHelpText(type)}
          </p>
          {url && (
            <details className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              <summary>Chi tiết URL</summary>
              <code className="block mt-2 p-2 bg-gray-50 rounded break-all text-left">{url}</code>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (type === "panorama-image") {
    return (
      <div className={`relative rounded-[3rem] overflow-hidden bg-gray-900 border-8 border-white shadow-2xl h-[400px] md:h-[550px] ${className}`}>
        <div className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">Panorama 360°</span>
        </div>

        <div className="absolute bottom-6 left-6 z-20 bg-black/50 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/10">
          Kéo để xoay ảnh 360°
        </div>

        {panoramaError && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 rounded-[2.5rem]">
            <div className="text-center text-white space-y-3 px-6">
              <span className="text-4xl block">⚠️</span>
              <p className="text-sm font-semibold">Không thể tải panorama</p>
              <p className="text-xs text-gray-300">{panoramaError}</p>
            </div>
          </div>
        )}

        <div ref={panoramaContainerRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={`relative rounded-[3rem] overflow-hidden bg-gray-900 border-8 border-white shadow-2xl h-[400px] md:h-[550px] ${className}`}>
      <div className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
        <span className="text-[10px] text-white font-black uppercase tracking-widest">Virtual Tour 360°</span>
      </div>

      {showError && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 rounded-[2.5rem]">
          <div className="text-center text-white space-y-3">
            <span className="text-4xl block">⚠️</span>
            <p className="text-sm">Không thể tải iframe từ URL này</p>
            <p className="text-xs text-gray-300">Kiểm tra URL có hợp lệ hay không</p>
          </div>
        </div>
      )}

      <iframe
        src={embeddableUrl}
        className="w-full h-full border-none"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-popups allow-forms allow-presentation"
        onError={handleIframeError}
      />
    </div>
  );
}
