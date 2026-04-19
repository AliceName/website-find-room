import React from "react";

interface AmenityTagProps {
  name: string;
  icon?: string;
  selected?: boolean;
  onToggle?: (name: string) => void;
  removable?: boolean;
  onRemove?: () => void;
}

export default function AmenityTag({
  name,
  icon = "✨",
  selected = false,
  onToggle,
  removable = false,
  onRemove,
}: AmenityTagProps) {
  return (
    <div
      onClick={() => onToggle?.(name)}
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-full
        border-2 font-medium text-sm transition-all cursor-pointer
        ${
          selected
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
        }
      `}
    >
      <span>{icon}</span>
      <span>{name}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 hover:text-red-600 font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
}
