"use client";

import { useMemo, useState } from "react";
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
  cityOptions?: Array<{ value: string; label: string }>;
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

const AMENITY_ICON_MAP: Record<string, string> = {
  "wifi": "📶",
  "internet": "📶",
  "máy lạnh": "❄️",
  "may lanh": "❄️",
  "máy giặt": "🫧",
  "may giat": "🫧",
  "máy nước nóng": "🚿",
  "may nuoc nong": "🚿",
  "tủ lạnh": "🧊",
  "tu lanh": "🧊",
  "giường": "🛏️",
  "giuong": "🛏️",
  "tủ quần áo": "🗄️",
  "tu quan ao": "🗄️",
  "bàn ghế": "🪑",
  "ban ghe": "🪑",
  "nấu ăn": "🍳",
  "nau an": "🍳",
  "bếp từ": "🍲",
  "bep tu": "🍲",
  "nhà vệ sinh riêng": "🚽",
  "nha ve sinh rieng": "🚽",
  "ban công": "🌿",
  "ban cong": "🌿",
  "cửa sổ thoáng": "🪟",
  "cua so thoang": "🪟",
  "thang máy": "🛗",
  "thang may": "🛗",
  "chỗ để xe": "🛵",
  "cho de xe": "🛵",
  "giờ tự do": "🕐",
  "gio tu do": "🕐",
  "khóa vân tay": "🔐",
  "khoa van tay": "🔐",
  "camera": "📷",
  "an ninh": "🛡️",
  "pccc": "🧯",
  "dọn vệ sinh": "🧹",
  "don ve sinh": "🧹",
  "cho nuôi thú cưng": "🐾",
  "cho nuoi thu cung": "🐾",
  "không chung chủ": "🏠",
  "khong chung chu": "🏠",
  "gần chợ": "🛒",
  "gan cho": "🛒",
  "gần siêu thị": "🛒",
  "gan sieu thi": "🛒",
};

const getAmenityIcon = (name: string, fallback = "✨") => {
  const normalized = name.toLowerCase().trim();
  const exact = AMENITY_ICON_MAP[normalized];
  if (exact) return exact;

  const match = Object.entries(AMENITY_ICON_MAP).find(([key]) => normalized.includes(key));
  return match?.[1] || fallback;
};

export default function SearchFilter({
  onSearch,
  onReset,
  onMapClick,
  isMapOpen,
  amenities = [],
  cityOptions = [],
}: SearchFilterProps) {
  const defaultCity = cityOptions[0]?.value || "TP. Hồ Chí Minh";
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    city: defaultCity,
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
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const sortedAmenities = useMemo(
    () =>
      [...amenities].sort((a, b) => {
        const iconA = a.icon || getAmenityIcon(a.amenity_name);
        const iconB = b.icon || getAmenityIcon(b.amenity_name);
        if (iconA !== iconB) return iconA.localeCompare(iconB, "vi");
        return a.amenity_name.localeCompare(b.amenity_name, "vi");
      }),
    [amenities]
  );
  const visibleAmenities = showAllAmenities ? sortedAmenities : sortedAmenities.slice(0, 8);
  const hiddenCount = Math.max(sortedAmenities.length - visibleAmenities.length, 0);

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
      city: defaultCity,
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
    <div className="rounded-lg border border-gray-200 bg-white p-2 space-y-2 shadow-md">
      {/* Search Keyword */}
      <div className="transition-all duration-[180ms] ease-[var(--ease-out-quart)]">
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
        className="w-full flex items-center justify-between rounded-lg bg-gray-50 p-2 text-sm transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-gray-100 active:scale-[0.99]"
      >
        <span className="font-bold text-gray-700">Bộ lọc nâng cao</span>
        <span className="text-sm">{isExpanded ? "▼" : "▶"}</span>
      </button>

      <div className={`grid transition-[grid-template-rows,opacity] duration-[220ms] ease-[var(--ease-out-quart)] ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-gray-200 pt-2">
            {/* 1. Vị trí */}
            <div className="transition-all duration-[180ms] ease-[var(--ease-out-quart)]">
              <LocationSelect
                city={filters.city}
                district={filters.district}
                ward={filters.ward}
                onLocationChange={handleLocationChange}
                cityOptions={cityOptions}
              />
            </div>

            {/* 2. Loại phòng */}
            <div className="transition-all duration-[180ms] ease-[var(--ease-out-quart)]">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Loại phòng
              </label>
              <select
                value={filters.roomType || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, roomType: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="space-y-1 transition-all duration-[180ms] ease-[var(--ease-out-quart)]">
              <label className="block text-xs font-bold uppercase text-gray-700">Giá thuê (VNĐ)</label>
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
            <div className="space-y-1 transition-all duration-[180ms] ease-[var(--ease-out-quart)]">
              <label className="block text-xs font-bold uppercase text-gray-700">Diện tích (m²)</label>
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
              <div className="transition-all duration-[180ms] ease-[var(--ease-out-quart)]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    Tiện ích
                  </label>
                  <span className="text-[11px] text-gray-500">
                    {visibleAmenities.length}/{sortedAmenities.length}
                  </span>
                </div>
                {!filters.city || !filters.district ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-700">
                    ⚠️ Vui lòng chọn thành phố và quận huyện trước
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {visibleAmenities.map((amenity) => (
                        <AmenityTag
                          key={amenity.amenity_id}
                          name={amenity.amenity_name}
                          icon={amenity.icon || getAmenityIcon(amenity.amenity_name)}
                          selected={filters.amenities?.includes(amenity.amenity_id)}
                          onToggle={() => toggleAmenity(amenity.amenity_id)}
                        />
                      ))}
                    </div>

                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllAmenities((prev) => !prev)}
                        className="mt-2 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                      >
                        {showAllAmenities
                          ? "Thu gọn tiện ích"
                          : `Xem thêm ${hiddenCount} tiện ích`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex gap-2 border-t border-gray-200 pt-2 transition-all duration-[180ms] ease-[var(--ease-out-quart)]">
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