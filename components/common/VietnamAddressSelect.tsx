"use client";

import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "https://provinces.open-api.vn/api";

type Ward = {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  district_code: number;
};

type District = {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
  wards?: Ward[];
};

type Province = {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts?: District[];
};

interface VietnamAddressSelectProps {
  city?: string;
  district?: string;
  ward?: string;
  onAddressChange?: (city: string, district: string, ward: string) => void;
  externalAddress?: {
    city?: string;
    district?: string;
    ward?: string;
    address_detail?: string;
  } | null;
  required?: boolean;
}

const selectCls =
  "w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all " +
  "disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer";

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
}

export default function VietnamAddressSelect({
  city = "",
  district = "",
  ward = "",
  onAddressChange,
  externalAddress = null,
  required = false,
}: VietnamAddressSelectProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/?depth=2`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Province[] = await res.json();
        setProvinces(data);
      } catch (err) {
        setError("Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại.");
        console.error("Load provinces error:", err);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  useEffect(() => {
    if (provinces.length === 0) return;

    const effectiveCity = externalAddress?.city || city;
    const found = provinces.find((p) => p.name === effectiveCity) ?? null;
    setSelectedProvince(found);
    setSelectedDistrict(null);
    setSelectedWard(null);
  }, [city, externalAddress?.city, provinces]);

  const fetchDistricts = useCallback(async (provinceCode: number) => {
    setLoadingDistricts(true);
    setError(null);
    setDistricts([]);
    setWards([]);
    try {
      const res = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Province = await res.json();
      setDistricts(data.districts ?? []);
    } catch (err) {
      setError("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      console.error("Load districts error:", err);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const fetchWards = useCallback(async (districtCode: number) => {
    setLoadingWards(true);
    setError(null);
    setWards([]);
    try {
      const res = await fetch(`${API_BASE}/d/${districtCode}?depth=2`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: District = await res.json();
      setWards(data.wards ?? []);
    } catch (err) {
      setError("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
      console.error("Load wards error:", err);
    } finally {
      setLoadingWards(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.code);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setSelectedWard(null);
    }
  }, [selectedProvince, fetchDistricts]);

  useEffect(() => {
    if (districts.length === 0) return;

    const effectiveDistrict = externalAddress?.district || district;
    const found = districts.find((d) => d.name === effectiveDistrict) ?? null;
    setSelectedDistrict(found);
    setSelectedWard(null);
  }, [district, externalAddress?.district, districts]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchWards(selectedDistrict.code);
    } else {
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedDistrict, fetchWards]);

  useEffect(() => {
    if (wards.length === 0) return;

    const effectiveWard = externalAddress?.ward || ward;
    const found = wards.find((w) => w.name === effectiveWard) ?? null;
    setSelectedWard(found);
  }, [ward, externalAddress?.ward, wards]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const province = provinces.find((p) => p.code === code) ?? null;
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    onAddressChange?.(province?.name ?? "", "", "");
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const dist = districts.find((d) => d.code === code) ?? null;
    setSelectedDistrict(dist);
    setSelectedWard(null);
    onAddressChange?.(selectedProvince?.name ?? "", dist?.name ?? "", "");
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const wardItem = wards.find((w) => w.code === code) ?? null;
    setSelectedWard(wardItem);
    onAddressChange?.(selectedProvince?.name ?? "", selectedDistrict?.name ?? "", wardItem?.name ?? "");
  };

  const addressPreview = [selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(", ");
  const externalPreview = externalAddress?.address_detail || [externalAddress?.ward, externalAddress?.district, externalAddress?.city].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-red-500 shrink-0">⚠️</span>
          <span className="text-red-600 font-medium flex-1">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
          Tỉnh / Thành phố{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <select value={selectedProvince?.code ?? ""} onChange={handleProvinceChange} disabled={loadingProvinces} required={required} className={selectCls}>
            <option value="">{loadingProvinces ? "Đang tải..." : "-- Chọn tỉnh / thành phố --"}</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            {loadingProvinces ? <Spinner /> : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
          Quận / Huyện{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <select value={selectedDistrict?.code ?? ""} onChange={handleDistrictChange} disabled={!selectedProvince || loadingDistricts} required={required} className={selectCls}>
            <option value="">{!selectedProvince ? "-- Chọn tỉnh/thành trước --" : loadingDistricts ? "Đang tải..." : `-- Chọn quận / huyện (${districts.length}) --`}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            {loadingDistricts ? <Spinner /> : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
          Phường / Xã{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <select value={selectedWard?.code ?? ""} onChange={handleWardChange} disabled={!selectedDistrict || loadingWards} required={required} className={selectCls}>
            <option value="">{!selectedDistrict ? "-- Chọn quận / huyện trước --" : loadingWards ? "Đang tải..." : `-- Chọn phường / xã (${wards.length}) --`}</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            {loadingWards ? <Spinner /> : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
          </div>
        </div>
      </div>

      {(externalPreview || addressPreview) && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-2">
          <span className="text-blue-500 shrink-0 mt-0.5">📍</span>
          <div className="text-sm font-semibold text-blue-700 leading-snug space-y-1">
            {externalPreview && <p>Gợi ý từ vị trí: {externalPreview}</p>}
            {addressPreview && <p>Địa chỉ đã chọn: {addressPreview}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
