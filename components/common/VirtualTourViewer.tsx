"use client";

import React, { useMemo, useState } from "react";

interface VirtualTourViewerProps {
  url: string | null;
  className?: string;
}

/**
 * Converts various URL formats to embeddable format
 * Supports: Google Maps Embed API, Street View, Matterport, YouTube 360
 */
function convertToEmbeddableUrl(url: string): { embeddableUrl: string | null; type: string } {
  if (!url) return { embeddableUrl: null, type: "none" };

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
    case "unsupported":
      return "Định dạng URL không được hỗ trợ. Vui lòng sử dụng: Google Maps Embed, Matterport hoặc YouTube 360°";
    default:
      return "";
  }
}

export function VirtualTourViewer({ url, className = "" }: VirtualTourViewerProps) {
  const [showError, setShowError] = useState(false);
  const { embeddableUrl, type } = useMemo(() => convertToEmbeddableUrl(url || ""), [url]);

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
