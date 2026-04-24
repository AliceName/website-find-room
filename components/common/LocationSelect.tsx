"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Input from "./Input";

interface LocationSelectProps {
  city?: string;
  district?: string;
  ward?: string;
  onLocationChange?: (city: string, district: string, ward: string) => void;
  showWard?: boolean;
  cityOptions?: Array<{ value: string; label: string }>;
}

export default function LocationSelect({
  city = "TP. Hồ Chí Minh",
  district = "",
  ward = "",
  onLocationChange,
  showWard = false,
  cityOptions = [],
}: LocationSelectProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<Array<{ value: string; label: string }>>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [localCity, setLocalCity] = useState(city);
  const [localDistrict, setLocalDistrict] = useState(district);
  const [localWard, setLocalWard] = useState(ward);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load unique cities from database
  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data } = await supabase
          .from("locations")
          .select("city")
          .order("city");

        const uniqueCities = Array.from(new Set(data?.map((d) => d.city) || []));
        setCities(uniqueCities as string[]);
      } catch (err) {
        console.error("Lỗi load thành phố:", err);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // Load districts when city changes
  useEffect(() => {
    if (!localCity) return;

    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const { data } = await supabase
          .from("locations")
          .select("district")
          .eq("city", localCity)
          .order("district");

        const uniqueDistricts = Array.from(
          new Map(
            (data?.map((d) => d.district) || []).map((districtName) => [districtName, districtName])
          ).entries()
        ).map(([value]) => ({
          value,
          label: `${value} (${(data?.filter((d) => d.district === value).length || 0)})`,
        }));
        setDistricts(uniqueDistricts as Array<{ value: string; label: string }>);
        setLocalDistrict("");
        setLocalWard("");
        setWards([]);
      } catch (err) {
        console.error("Lỗi load quận:", err);
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [localCity]);

  // Load wards when district changes
  useEffect(() => {
    if (!localDistrict || !showWard) return;

    const loadWards = async () => {
      setLoadingWards(true);
      try {
        const { data } = await supabase
          .from("locations")
          .select("ward")
          .eq("city", localCity)
          .eq("district", localDistrict)
          .order("ward");

        const uniqueWards = Array.from(new Set(data?.map((d) => d.ward) || []));
        setWards(uniqueWards as string[]);
        setLocalWard("");
      } catch (err) {
        console.error("Lỗi load phường:", err);
      } finally {
        setLoadingWards(false);
      }
    };

    loadWards();
  }, [localDistrict, showWard, localCity]);

  const handleCityChange = (newCity: string) => {
    setLocalCity(newCity);
    onLocationChange?.(newCity, "", "");
  };

  const handleDistrictChange = (newDistrict: string) => {
    setLocalDistrict(newDistrict);
    onLocationChange?.(localCity, newDistrict, "");
  };

  const handleWardChange = (newWard: string) => {
    setLocalWard(newWard);
    onLocationChange?.(localCity, localDistrict, newWard);
  };

  return (
    <div className="space-y-3">
      {/* City Select */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
          Thành phố
        </label>
        <select
          value={localCity}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={loadingCities}
          className="w-full px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">-- Chọn thành phố --</option>
          {cityOptions.length > 0
            ? cityOptions.map((cityOption) => (
                <option key={cityOption.value} value={cityOption.value}>
                  {cityOption.label}
                </option>
              ))
            : cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
        </select>
      </div>

      {/* District Select */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
          Quận / Huyện
        </label>
        <select
          value={localDistrict}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={!localCity || loadingDistricts}
          className="w-full px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
        >
          <option value="">-- Chọn quận/huyện --</option>
          {districts.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ward Select */}
      {showWard && (
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
            Phường / Xã
          </label>
          <select
            value={localWard}
            onChange={(e) => handleWardChange(e.target.value)}
            disabled={!localDistrict || loadingWards}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
          >
            <option value="">-- Chọn phường/xã --</option>
            {wards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
