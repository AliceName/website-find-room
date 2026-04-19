"use client";

import React, { useState } from "react";
import Input from "./Input";

interface AreaRangeProps {
  minArea?: number;
  maxArea?: number;
  onAreaChange?: (min: number, max: number) => void;
  step?: number;
}

export default function AreaRange({
  minArea = 0,
  maxArea = 200,
  onAreaChange,
  step = 5,
}: AreaRangeProps) {
  const [localMin, setLocalMin] = useState(minArea);
  const [localMax, setLocalMax] = useState(maxArea);

  const handleMinChange = (value: number) => {
    if (value <= localMax) {
      setLocalMin(value);
      onAreaChange?.(value, localMax);
    }
  };

  const handleMaxChange = (value: number) => {
    if (value >= localMin) {
      setLocalMax(value);
      onAreaChange?.(localMin, value);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
          Diện tích (m²)
        </label>
        <div className="space-y-3">
          {/* Range Slider */}
          <div className="relative pt-2">
            <input
              type="range"
              min={0}
              max={200}
              step={step}
              value={localMin}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-5"
            />
            <input
              type="range"
              min={0}
              max={200}
              step={step}
              value={localMax}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-4"
            />
            <div className="relative w-full h-2 bg-gray-200 rounded-lg">
              <div
                className="absolute h-2 bg-green-600 rounded-lg"
                style={{
                  left: `${(localMin / 200) * 100}%`,
                  right: `${100 - (localMax / 200) * 100}%`,
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
              icon="📐"
            />
            <Input
              label="Đến"
              type="number"
              value={localMax}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              step={step}
              min={localMin}
              max={200}
              icon="📐"
            />
          </div>

          {/* Display Range */}
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-green-700">
              {localMin}m² - {localMax}m²
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
