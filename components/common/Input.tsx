import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helper?: string;
}

export default function Input({
  label,
  error,
  icon,
  helper,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`
            w-full px-4 py-2.5 text-sm font-medium text-gray-800 
            bg-gray-50 border border-gray-200 rounded-lg
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all disabled:bg-gray-100 disabled:cursor-not-allowed
            ${icon ? "pl-10" : ""}
            ${error ? "border-red-300 focus:ring-red-500" : ""}
            ${className || ""}
          `}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium">⚠️ {error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
    </div>
  );
}
