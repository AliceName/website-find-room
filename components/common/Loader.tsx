import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({
  size = "md",
  text = "Đang tải...",
  fullScreen = false,
}: LoaderProps) {
  const sizeClass = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const containerClass = fullScreen
    ? "fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
    : "flex items-center justify-center";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <div
          className={`
            ${sizeClass[size]} 
            border-gray-200 border-t-blue-600 rounded-full animate-spin
          `}
        />
        {text && <p className="text-sm font-medium text-gray-600">{text}</p>}
      </div>
    </div>
  );
}