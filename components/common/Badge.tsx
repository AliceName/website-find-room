import React from "react";

type BadgeVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  className?: string;
}

export default function Badge({
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
}: BadgeProps) {
  const variantClass = {
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-cyan-100 text-cyan-800",
  };

  const sizeClass = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-bold rounded-full
        ${variantClass[variant]} ${sizeClass[size]} ${className || ""}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
