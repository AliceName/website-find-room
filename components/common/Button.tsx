import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const baseClass =
    "font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";

  const variantClass = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200",
    success: "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-200",
  };

  const sizeClass = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className || ""}`}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
