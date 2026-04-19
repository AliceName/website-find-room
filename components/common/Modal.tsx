import React from "react";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  type?: "info" | "success" | "danger" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  type = "info",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  isLoading = false,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    info: { icon: "ℹ️", color: "blue" },
    success: { icon: "✅", color: "green" },
    danger: { icon: "⚠️", color: "red" },
    confirm: { icon: "❓", color: "blue" },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        {(title || type !== "info") && (
          <div className="flex items-start gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div className="flex-1">
              {title && (
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        {children && <div className="text-sm text-gray-700">{children}</div>}

        {/* Actions */}
        {(onConfirm || type === "confirm" || type !== "info") && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            {onConfirm && (
              <Button
                variant={type === "danger" ? "danger" : "primary"}
                size="md"
                onClick={onConfirm}
                isLoading={isLoading}
                className="flex-1"
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}