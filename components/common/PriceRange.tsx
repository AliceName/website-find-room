"use client";

import React, { useState } from "react";
import Input from "./Input";

interface PriceRangeProps {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (min: number, max: number) => void;
  step?: number;
  currency?: string;
}

export default function PriceRange({
  minPrice = 0,
  maxPrice = 50000000,
  onPriceChange,
  step = 500000,
  currency = "đ",
}: PriceRangeProps) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const handleMinChange = (value: number) => {
    if (value <= localMax) {
      setLocalMin(value);
      onPriceChange?.(value, localMax);
    }
  };

  const handleMaxChange = (value: number) => {
    if (value >= localMin) {
      setLocalMax(value);
      onPriceChange?.(localMin, value);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M ${currency}`;
    }
    return `${(price / 1000).toFixed(0)}K ${currency}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
          Giá thuê / tháng
        </label>
        <div className="space-y-3">
          {/* Range Slider */}
          <div className="relative pt-2">
            <input
              type="range"
              min={0}
              max={50000000}
              step={step}
              value={localMin}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-5"
              style={{
                background: "transparent",
              }}
            />
            <input
              type="range"
              min={0}
              max={50000000}
              step={step}
              value={localMax}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-4"
              style={{
                background: "transparent",
              }}
            />
            <div className="relative w-full h-2 bg-gray-200 rounded-lg">
              <div
                className="absolute h-2 bg-blue-600 rounded-lg"
                style={{
                  left: `${(localMin / 50000000) * 100}%`,
                  right: `${100 - (localMax / 50000000) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Từ"
              type="number"
              value={localMin}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              step={step}
              min={0}
              max={localMax}
            />
            <Input
              label="Đến"
              type="number"
              value={localMax}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              step={step}
              min={localMin}
              max={50000000}
            />
          </div>

          {/* Display Range */}
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-blue-700">
              {formatPrice(localMin)} - {formatPrice(localMax)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
