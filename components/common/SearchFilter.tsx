"use client";

import React, { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import PriceRange from "./PriceRange";
import AreaRange from "./AreaRange";
import LocationSelect from "./LocationSelect";
import AmenityTag from "./AmenityTag";

interface SearchFilterProps {
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  amenities?: Array<{ amenity_id: string; amenity_name: string; icon?: string }>;
}

export interface SearchFilters {
  keyword?: string;
  city?: string;
  district?: string;
  ward?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  roomType?: string;
}

const ROOM_TYPES = [
  { value: "phong_tro", label: "Phòng trọ" },
  { value: "can_ho_mini", label: "Căn hộ mini" },
  { value: "chung_cu", label: "Chung cư" },
  { value: "nha_nguyen_can", label: "Nhà nguyên căn" },
];

export default function SearchFilter({
  onSearch,
  onReset,
  amenities = [],
}: SearchFilterProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    city: "TP. Hồ Chí Minh",
    district: "",
    ward: "",
    minPrice: 0,
    maxPrice: 50000000,
    minArea: 0,
    maxArea: 200,
    amenities: [],
    roomType: "",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleLocationChange = (city: string, district: string, ward: string) => {
    setFilters((prev) => ({ ...prev, city, district, ward }));
  };

  const handlePriceChange = (min: number, max: number) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  };

  const handleAreaChange = (min: number, max: number) => {
    setFilters((prev) => ({ ...prev, minArea: min, maxArea: max }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...(prev.amenities || []), amenityId],
    }));
  };

  const handleSearch = () => {
    onSearch?.(filters);
  };

  const handleReset = () => {
    setFilters({
      keyword: "",
      city: "TP. Hồ Chí Minh",
      district: "",
      ward: "",
      minPrice: 0,
      maxPrice: 50000000,
      minArea: 0,
      maxArea: 200,
      amenities: [],
      roomType: "",
    });
    onReset?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-5 space-y-3">
      {/* Main Row: Keyword + Advanced Toggle + Search Button */}
      <div className="flex gap-2 flex-wrap md:flex-nowrap items-end">
        <div className="flex-grow min-w-[200px]">
          <Input
            type="text"
            placeholder="Tìm kiếm phòng trọ..."
            value={filters.keyword || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value }))
            }
            icon="🔍"
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-150 rounded-lg font-bold text-sm text-gray-700 transition whitespace-nowrap"
        >
          {isExpanded ? "⬆️ Ẩn bộ lọc" : "⬇️ Bộ lọc"}
        </button>

        <Button
          variant="primary"
          className="whitespace-nowrap"
          onClick={handleSearch}
        >
          🔍 Tìm
        </Button>
      </div>

      {/* Expandable Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Grid Layout for Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                📍 Địa điểm
              </label>
              <LocationSelect
                city={filters.city}
                district={filters.district}
                ward={filters.ward}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                🏠 Loại phòng
              </label>
              <select
                value={filters.roomType || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, roomType: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Tất cả --</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                💰 Giá (đ/tháng)
              </label>
              <PriceRange
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onPriceChange={handlePriceChange}
              />
            </div>

            {/* Area Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                📐 Diện tích (m²)
              </label>
              <AreaRange
                minArea={filters.minArea}
                maxArea={filters.maxArea}
                onAreaChange={handleAreaChange}
              />
            </div>
          </div>

          {/* Amenities - Full Width */}
          {amenities.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                ✨ Tiện ích
              </label>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <AmenityTag
                    key={amenity.amenity_id}
                    name={amenity.amenity_name}
                    icon={amenity.icon || "✨"}
                    selected={filters.amenities?.includes(amenity.amenity_id)}
                    onToggle={() => toggleAmenity(amenity.amenity_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-sm"
            >
              🔄 Xóa bộ lọc
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
