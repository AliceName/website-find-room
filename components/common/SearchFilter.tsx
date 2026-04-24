"use client";

import React, { useState } from "react";
import Button from "./Button";
import Input from "./Input";
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
    minPrice: undefined,
    maxPrice: undefined,
    minArea: undefined,
    maxArea: undefined,
    amenities: [],
    roomType: "",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Hàm xử lý thay đổi số (Giá & Diện tích) để tránh lỗi NaN
  const handleNumberChange = (field: keyof SearchFilters, value: string) => {
    const numericValue = value === "" ? undefined : Number(value);
    setFilters((prev) => ({ ...prev, [field]: numericValue }));
  };

  const handleLocationChange = (city: string, district: string, ward: string) => {
    setFilters((prev) => ({ ...prev, city, district, ward }));
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
      minPrice: undefined,
      maxPrice: undefined,
      minArea: undefined,
      maxArea: undefined,
      amenities: [],
      roomType: "",
    });
    onReset?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2 md:p-3 space-y-2">
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

      {/* Toggle Bộ lọc */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
      >
        <span className="font-bold text-gray-700">Bộ lọc nâng cao</span>
        <span className="text-sm">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          {/* 1. Vị trí */}
          <LocationSelect
            city={filters.city}
            district={filters.district}
            ward={filters.ward}
            onLocationChange={handleLocationChange}
          />

          {/* 2. Loại phòng */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Loại phòng
            </label>
            <select
              value={filters.roomType || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, roomType: e.target.value }))
              }
              className="w-full px-3 py-1.5 text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Tất cả loại --</option>
              {ROOM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Khoảng giá (Input thay cho Slider) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">Giá thuê (VNĐ)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Giá từ..."
                value={filters.minPrice ?? ""}
                onChange={(e) => handleNumberChange("minPrice", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Giá đến..."
                value={filters.maxPrice ?? ""}
                onChange={(e) => handleNumberChange("maxPrice", e.target.value)}
              />
            </div>
          </div>

          {/* 4. Diện tích (Input thay cho Slider) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">Diện tích (m²)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Từ..."
                value={filters.minArea ?? ""}
                onChange={(e) => handleNumberChange("minArea", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Đến..."
                value={filters.maxArea ?? ""}
                onChange={(e) => handleNumberChange("maxArea", e.target.value)}
              />
            </div>
          </div>

          {/* 5. Tiện ích */}
          {amenities.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Tiện ích
              </label>
              {!filters.city || !filters.district ? (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                  ⚠️ Vui lòng chọn thành phố và quận huyện trước
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
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
              )}
            </div>
          )}
        </div>
      )}

      {/* Nút hành động */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <Button variant="ghost" className="flex-1 text-xs py-1" onClick={handleReset}>
          Xóa bộ lọc
        </Button>
        <Button variant="primary" className="flex-1 text-xs py-1" onClick={handleSearch}>
          🔍 Tìm kiếm
        </Button>
        <button
          type="button"
          className={`flex-1 px-2 py-1 text-xs rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
            isMapOpen
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
          onClick={onMapClick}
        >
          {isMapOpen ? "✕ Đóng bản đồ" : "📍 Xem Bản đồ"}
        </button>
      </div>
    </div>
  );
}