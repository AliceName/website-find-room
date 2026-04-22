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
  onMapClick?: () => void;
  isMapOpen?: boolean;
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
  onMapClick,
  isMapOpen,
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 space-y-4">
      {/* Search Keyword */}
      <div>
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

      {/* Expandable Filters */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
      >
        <span className="font-bold text-gray-700">Bộ lọc nâng cao</span>
        <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Location */}
          <LocationSelect
            city={filters.city}
            district={filters.district}
            ward={filters.ward}
            onLocationChange={handleLocationChange}
          />

          {/* Room Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Loại phòng
            </label>
            <select
              value={filters.roomType || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, roomType: e.target.value }))
              }
              className="w-full px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Tất cả loại --</option>
              {ROOM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <PriceRange
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onPriceChange={handlePriceChange}
          />

          {/* Area Range */}
          <AreaRange
            minArea={filters.minArea}
            maxArea={filters.maxArea}
            onAreaChange={handleAreaChange}
          />

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                Tiện ích
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
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-200">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={handleReset}
        >
          Xóa bộ lọc
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleSearch}
        >
          🔍 Tìm kiếm
        </Button>

        <button
          type="button"
          className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isMapOpen
            ? "bg-red-50 text-red-600 border border-red-200"
            : "bg-green-600 text-white hover:bg-green-700"
            }`}
          onClick={onMapClick} // <--- Gọi hàm này
        >
          {isMapOpen ? "✕ Đóng bản đồ" : "📍 Xem Bản đồ"}
        </button>
      </div>
    </div>
  );
}