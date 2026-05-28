"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { normalizeAdministrativeName } from "@/lib/utils/addressNormalization";

// API địa giới hành chính v2: Tỉnh/Thành → Phường/Xã
const API_BASE = "https://provinces.open-api.vn/api/v2";

interface Province {
    code: string;
    name: string;
    type: string;
}

interface Ward {
    code: string;
    name: string;
    province_code: string;
}

interface Props {
    city: string;       // tỉnh/thành
    district: string;   // giữ prop để tương thích, không dùng
    ward?: string;      // phường/xã — cấp 2 mới
    onAddressChange: (city: string, ward: string) => void;
    required?: boolean;
}

export default function VietnamAddressSelect({
    city,
    ward = "",
    onAddressChange,
    required,
}: Props) {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Load 34 tỉnh/thành khi mount
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            setLoadError(null);
            try {
                const res = await fetch(`${API_BASE}/p?depth=1`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: Province[] = await res.json();
                setProvinces(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Lỗi tải tỉnh/thành:", err);
                setLoadError("Không tải được danh sách tỉnh/thành.");
            } finally {
                setLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, []);

    // Khi city thay đổi từ bên ngoài, sync lại code
    useEffect(() => {
        if (!city || provinces.length === 0) return;
        const found = provinces.find((p) => {
            const provinceName = normalizeAdministrativeName(p.name);
            const cityName = normalizeAdministrativeName(city);
            return provinceName === cityName || provinceName.includes(cityName) || cityName.includes(provinceName);
        });
        if (found && found.code !== selectedProvinceCode) {
            setSelectedProvinceCode(found.code);
        }
    }, [city, provinces, selectedProvinceCode]);

    // Load phường/xã khi chọn tỉnh
    useEffect(() => {
        if (!selectedProvinceCode) {
            setWards([]);
            return;
        }
        const fetchWards = async () => {
            setLoadingWards(true);
            setLoadError(null);
            try {
                const res = await fetch(`${API_BASE}/p/${selectedProvinceCode}?depth=2`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const rawWards = Array.isArray(data?.wards) ? data.wards : [];
                const filtered = rawWards.map((w: any) => ({
                    code: String(w.code),
                    name: w.name,
                    province_code: String(selectedProvinceCode),
                }));
                console.log("[VietnamAddressSelect] wards loaded", {
                    selectedProvinceCode,
                    responseKeys: data ? Object.keys(data) : [],
                    wardsCount: rawWards.length,
                    sampleWard: rawWards[0] ?? null,
                });
                setWards(filtered);
            } catch (err) {
                console.error("Lỗi tải phường/xã:", err);
                setLoadError("Không tải được danh sách phường/xã.");
                setWards([]);
            } finally {
                setLoadingWards(false);
            }
        };
        fetchWards();
    }, [selectedProvinceCode]);

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const province = provinces.find((p) => p.code === code);
        setSelectedProvinceCode(code);
        setWards([]);
        onAddressChange(province?.name ?? "", "");
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const w = wards.find((wardItem) => wardItem.code === code);
        onAddressChange(city, w?.name ?? "");
    };

    const currentWardCode = wards.find((w) => normalizeAdministrativeName(w.name) === normalizeAdministrativeName(ward))?.code ?? "";

    return (
        <div className="space-y-4">
            {/* Tỉnh / Thành phố */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Tỉnh / Thành phố {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    <select
                        value={selectedProvinceCode}
                        onChange={handleProvinceChange}
                        disabled={loadingProvinces}
                        className="w-full appearance-none rounded-2xl border border-sky-200 bg-white px-5 py-4 pr-12 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none disabled:opacity-60 cursor-pointer"
                    >
                        <option value="">-- Chọn tỉnh / thành phố --</option>
                        {provinces.map((p) => (
                            <option key={p.code} value={p.code}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {loadingProvinces
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <ChevronDown className="h-4 w-4" />}
                    </div>
                </div>
            </div>

            {loadError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {loadError}
                </div>
            )}

            {/* Phường / Xã */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Phường / Xã {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    <select
                        value={currentWardCode}
                        onChange={handleWardChange}
                        disabled={!selectedProvinceCode || loadingWards}
                        className="w-full appearance-none rounded-2xl border border-sky-200 bg-white px-5 py-4 pr-12 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none disabled:opacity-60 cursor-pointer"
                    >
                        <option value="">
                            {!selectedProvinceCode
                                ? "-- Chọn tỉnh/thành trước --"
                                : loadingWards
                                ? "Đang tải..."
                                : "-- Chọn phường / xã --"}
                        </option>
                        {wards.map((w) => (
                            <option key={w.code} value={w.code}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {loadingWards
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <ChevronDown className="h-4 w-4" />}
                    </div>
                </div>
            </div>
        </div>
    );
}
