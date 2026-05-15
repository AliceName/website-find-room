"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchFilterProps {
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  onMapClick?: () => void;
  isMapOpen?: boolean;
  cityOptions?: Option[];
  districtOptions?: Option[];
  amenityOptions?: Option[];
}

export interface SearchFilters {
  keyword?: string;
  roomType?: string;
  priceRange?: string;
  areaRange?: string;
  sortBy?: string;
  city?: string;
  district?: string;
  amenities?: string[];
}

export const ROOM_TYPES = [
  { value: "", label: "Tất cả loại phòng" },
  { value: "phong_tro", label: "Phòng trọ" },
  { value: "can_ho_mini", label: "Căn hộ mini" },
  { value: "chung_cu", label: "Chung cư" },
  { value: "nha_nguyen_can", label: "Nhà nguyên căn" },
  { value: "ky_tuc_xa", label: "Ký túc xá" },
];

const PRICE_RANGES = [
  { value: "", label: "Tất cả mức giá" },
  { value: "0-1000000", label: "Dưới 1 triệu" },
  { value: "1000000-2000000", label: "1 – 2 triệu" },
  { value: "2000000-3000000", label: "2 – 3 triệu" },
  { value: "3000000-5000000", label: "3 – 5 triệu" },
  { value: "5000000-7000000", label: "5 – 7 triệu" },
  { value: "7000000-10000000", label: "7 – 10 triệu" },
  { value: "10000000-", label: "Trên 10 triệu" },
];

const AREA_RANGES = [
  { value: "", label: "Tất cả diện tích" },
  { value: "0-20", label: "Dưới 20 m²" },
  { value: "20-30", label: "20 – 30 m²" },
  { value: "30-50", label: "30 – 50 m²" },
  { value: "50-70", label: "50 – 70 m²" },
  { value: "70-100", label: "70 – 100 m²" },
  { value: "100-", label: "Trên 100 m²" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Tin mới nhất" },
  { value: "oldest", label: "Tin cũ nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "area_asc", label: "Diện tích tăng" },
  { value: "area_desc", label: "Diện tích giảm" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </span>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-[7px] text-sm text-slate-700
          transition-all hover:border-teal-400
          focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10
          disabled:cursor-not-allowed disabled:opacity-40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActiveTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#1E3A8A]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100"
        aria-label={`Xóa bộ lọc ${label}`}
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SearchFilter({
  onSearch,
  onReset,
  onMapClick,
  isMapOpen,
  cityOptions = [],
  districtOptions = [],
  amenityOptions = [],
}: SearchFilterProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    roomType: "",
    priceRange: "",
    areaRange: "",
    sortBy: "newest",
    city: "",
    district: "",
    amenities: [],
  });

  const [showAmenities, setShowAmenities] = useState(false);
  const amenityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (amenityRef.current && !amenityRef.current.contains(event.target as Node)) {
        setShowAmenities(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (field: keyof SearchFilters, value: string | string[]) => {
    let newFilters = { ...filters, [field]: value };
    if (field === "city") newFilters = { ...newFilters, district: "" };
    setFilters(newFilters);
    // ✅ Gọi onSearch với newFilters mới nhất — kể cả sortBy
    onSearch?.(newFilters);
  };

  const toggleAmenity = (id: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id];
    handleChange("amenities", updated);
  };

  const handleReset = () => {
    const cleared: SearchFilters = {
      roomType: "",
      priceRange: "",
      areaRange: "",
      sortBy: "newest",
      city: "",
      district: "",
      amenities: [],
    };
    setFilters(cleared);
    onReset?.();
  };

  // ── Active filter tags ──────────────────────────────────────────────────────

  const activeTags: { key: string; label: string; clear: () => void }[] = [];

  if (filters.roomType) {
    const found = ROOM_TYPES.find((t) => t.value === filters.roomType);
    if (found)
      activeTags.push({
        key: "roomType",
        label: found.label,
        clear: () => handleChange("roomType", ""),
      });
  }
  if (filters.priceRange) {
    const found = PRICE_RANGES.find((r) => r.value === filters.priceRange);
    if (found)
      activeTags.push({
        key: "priceRange",
        label: found.label,
        clear: () => handleChange("priceRange", ""),
      });
  }
  if (filters.areaRange) {
    const found = AREA_RANGES.find((r) => r.value === filters.areaRange);
    if (found)
      activeTags.push({
        key: "areaRange",
        label: found.label,
        clear: () => handleChange("areaRange", ""),
      });
  }
  if (filters.city) {
    const found = cityOptions.find((c) => c.value === filters.city);
    if (found)
      activeTags.push({
        key: "city",
        label: found.label,
        clear: () => handleChange("city", ""),
      });
  }
  if (filters.district) {
    const found = districtOptions.find((d) => d.value === filters.district);
    if (found)
      activeTags.push({
        key: "district",
        label: found.label,
        clear: () => handleChange("district", ""),
      });
  }
  (filters.amenities || []).forEach((id) => {
    const found = amenityOptions.find((a) => a.value === id);
    if (found)
      activeTags.push({
        key: `amenity-${id}`,
        label: found.label,
        clear: () => toggleAmenity(id),
      });
  });

  const hasActiveFilters = activeTags.length > 0;

  const amenityLabel =
    (filters.amenities?.length ?? 0) > 0
      ? `${filters.amenities!.length} tiện ích`
      : "Chọn tiện ích...";

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 bg-[#1E3A8A] px-4 py-2.5">
        <svg className="h-4 w-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4h18M7 8h10M11 12h2M9 16h6" />
        </svg>
        <span className="text-sm font-medium text-white">Bộ lọc tìm kiếm</span>
        {hasActiveFilters && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-blue-100">
            {activeTags.length} đang bật
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-3 p-4">

        {/* Row 1 — 4 columns */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SelectField
            label="Loại phòng"
            value={filters.roomType || ""}
            onChange={(v) => handleChange("roomType", v)}
            options={ROOM_TYPES}
          />
          <SelectField
            label="Giá thuê"
            value={filters.priceRange || ""}
            onChange={(v) => handleChange("priceRange", v)}
            options={PRICE_RANGES}
          />
          <SelectField
            label="Diện tích"
            value={filters.areaRange || ""}
            onChange={(v) => handleChange("areaRange", v)}
            options={AREA_RANGES}
          />

          {/* Tiện ích — custom dropdown */}
          <div className="flex flex-col" ref={amenityRef}>
            <FieldLabel>Tiện ích</FieldLabel>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAmenities((p) => !p)}
                className={`flex w-full items-center justify-between rounded-lg border bg-slate-50 px-3 py-[7px] text-sm text-slate-700
                  transition-all hover:border-teal-400
                  focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10
                  ${showAmenities ? "border-[#1E3A8A] ring-2 ring-[#1E3A8A]/10" : "border-slate-200"}`}
              >
                <span className="truncate">{amenityLabel}</span>
                <svg
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${showAmenities ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAmenities && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-md">
                  {amenityOptions.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-400">Không có tiện ích</p>
                  ) : (
                    amenityOptions.map((opt) => {
                      const checked = filters.amenities?.includes(opt.value) ?? false;
                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAmenity(opt.value)}
                            className="h-4 w-4 rounded border-slate-300 accent-[#1E3A8A]"
                          />
                          <span className="text-sm text-slate-700">{opt.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2 — 2 columns */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SelectField
            label="Thành phố"
            value={filters.city || ""}
            onChange={(v) => handleChange("city", v)}
            options={[{ value: "", label: "Tất cả thành phố" }, ...cityOptions]}
          />
          <SelectField
            label="Quận / Huyện"
            value={filters.district || ""}
            onChange={(v) => handleChange("district", v)}
            disabled={!filters.city}
            options={[
              {
                value: "",
                label: filters.city ? "Tất cả quận/huyện" : "-- Chọn thành phố trước --",
              },
              ...districtOptions,
            ]}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">

        {/* Left — active tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {hasActiveFilters ? (
            <>
              {activeTags.map((tag) => (
                <ActiveTag key={tag.key} label={tag.label} onRemove={tag.clear} />
              ))}
              <button
                type="button"
                onClick={handleReset}
                className="ml-1 text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600"
              >
                Xóa tất cả
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400">Chưa chọn bộ lọc nào</span>
          )}
        </div>

        {/* Right — sort + actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sắp xếp:</span>
          <select
            value={filters.sortBy || "newest"}
            onChange={(e) => handleChange("sortBy", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700
              focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="h-5 w-px bg-slate-200" />

          {/* Bản đồ */}
          <button
            type="button"
            onClick={onMapClick}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.98]
              ${isMapOpen
                ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4" />
            </svg>
            {isMapOpen ? "Đóng bản đồ" : "Bản đồ"}
          </button>

          {/* Tìm kiếm */}
          <button
            type="button"
            onClick={() => onSearch?.(filters)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1e3278] active:scale-[0.98]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            Tìm kiếm
          </button>
        </div>
      </div>

    </div>
  );
}