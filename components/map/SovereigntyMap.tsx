"use client";

import { useState } from "react";
import { Image as ImageIcon, Map } from "lucide-react";

type SovereigntyMapProps = {
  slug: "hoang-sa" | "truong-sa";
  archipelagoName: string;
  imageSrc: string;
};

export default function SovereigntyMap({ slug, archipelagoName, imageSrc }: SovereigntyMapProps) {
  const [mode, setMode] = useState<"image" | "live">("image");
  const locationLabel = slug === "hoang-sa" ? "Hoàng Sa, Đà Nẵng" : "Trường Sa, Khánh Hòa";

  return (
    <div className="relative h-full min-h-[620px] w-full bg-sky-100">
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap gap-2">
        <span className="rounded-lg bg-white/95 px-3 py-2 text-xs font-black text-sky-800 shadow-lg">
          {locationLabel}
        </span>
      </div>

      {mode === "image" ? (
        <div className="flex h-full min-h-[620px] items-center justify-center bg-slate-100">
          <img
            src={imageSrc}
            alt={`Ảnh chi tiết ${archipelagoName} từ bản đồ hành chính VNSDI`}
            className="h-full min-h-[620px] w-full object-cover"
          />
        </div>
      ) : (
        <iframe
          src="/api/vnsdi-map"
          title={`Bản đồ hành chính Việt Nam VNSDI - ${archipelagoName}`}
          className="h-full min-h-[620px] w-full border-0"
          loading="eager"
          referrerPolicy="origin"
        />
      )}

      <button
        type="button"
        onClick={() => setMode(mode === "image" ? "live" : "image")}
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white/95 px-3 py-2 text-xs font-black text-sky-800 shadow-lg transition hover:bg-sky-50"
      >
        {mode === "image" ? <Map className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
        {mode === "image" ? "Xem trực tiếp VNSDI" : "Xem ảnh chi tiết"}
      </button>
    </div>
  );
}
