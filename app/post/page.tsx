"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadRoomImage } from "@/lib/services/storage.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VietnamAddressSelect from "@/components/common/VietnamAddressSelect";
import PostLocationPicker from "@/components/map/PostLocationPicker";

const ROOM_TYPES = [
    { value: "phong_tro", label: "Phòng trọ" },
    { value: "can_ho_mini", label: "Căn hộ mini" },
    { value: "chung_cu", label: "Chung cư" },
    { value: "nha_nguyen_can", label: "Nhà nguyên căn" },
    { value: "ky_tuc_xa", label: "Ký túc xá" },
];

const STEPS = [
    { id: 1, label: "Thông tin cơ bản" },
    { id: 2, label: "Tiện ích & Mô tả" },
    { id: 3, label: "Hình ảnh & VR" },
];

const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

const DEFAULT_AMENITIES = [
    { label: "Wifi", icon: "📶" },
    { label: "Máy lạnh", icon: "❄️" },
    { label: "Máy giặt", icon: "🫧" },
    { label: "Máy nước nóng", icon: "🚿" },
    { label: "Tủ lạnh", icon: "🧊" },
    { label: "Giường", icon: "🛏️" },
    { label: "Tủ quần áo", icon: "🗄️" },
    { label: "Bàn ghế", icon: "🪑" },
    { label: "Nấu ăn", icon: "🍳" },
    { label: "Bếp từ", icon: "🍲" },
    { label: "Nhà vệ sinh riêng", icon: "🚽" },
    { label: "Ban công", icon: "🌿" },
    { label: "Cửa sổ thoáng", icon: "🪟" },
    { label: "Thang máy", icon: "🛗" },
    { label: "Chỗ để xe", icon: "🛵" },
    { label: "Giờ tự do", icon: "🕐" },
    { label: "Khóa vân tay", icon: "🔐" },
    { label: "Camera", icon: "📷" },
    { label: "An ninh 24/7", icon: "🛡️" },
    { label: "PCCC", icon: "🧯" },
    { label: "Dọn vệ sinh", icon: "🧹" },
    { label: "Cho nuôi thú cưng", icon: "🐾" },
    { label: "Không chung chủ", icon: "🏠" },
    { label: "Gần chợ/siêu thị", icon: "🛒" },
];

interface AmenityOption {
    amenity_id: string;
    amenity_name: string;
    icon?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                {label}
            </label>
            {children}
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-xs font-bold text-gray-400 whitespace-nowrap">{label}</span>
            <span className="text-xs font-bold text-gray-700 text-right line-clamp-2">{value || "—"}</span>
        </div>
    );
}

interface FormData {
    post_title: string;
    room_type: string;
    room_price: string;
    room_area: string;
    city: string;
    district: string;
    ward: string;
    address_detail: string;
    selectedAmenityIds: string[];
    room_description: string;
    vr_url: string;
    images: Array<{ file: File; is360: boolean }>;
}

export default function PostPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [upload360Mode, setUpload360Mode] = useState(false);
    const [amenities, setAmenities] = useState<AmenityOption[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [addressDetailHint, setAddressDetailHint] = useState<string>("");

    const [form, setForm] = useState<FormData>({
        post_title: "",
        room_type: "phong_tro",
        room_price: "",
        room_area: "",
        city: "",
        district: "",
        ward: "",
        address_detail: "",
        selectedAmenityIds: [],
        room_description: "",
        vr_url: "",
        images: [],
    });

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { router.push("/auth/login"); return; }
            supabase.from("users").select("user_role").eq("user_id", user.id).single().then(({ data }) => {
                setUserRole(data?.user_role ?? null);
            });
        });
        loadAmenities();
    }, [router]);

    const loadAmenities = async () => {
        const { data, error } = await supabase
            .from("amenities")
            .select("amenity_id, amenity_name")
            .order("amenity_name");

        if (error) {
            setAmenities(DEFAULT_AMENITIES.map((a, i) => ({
                amenity_id: `default_${i}`,
                amenity_name: a.label,
                icon: a.icon,
            })));
            return;
        }

        const existing = data ?? [];
        const existingNameSet = new Set(existing.map((a) => a.amenity_name.trim().toLowerCase()));
        const missingDefaults = DEFAULT_AMENITIES
            .filter((a) => !existingNameSet.has(a.label.trim().toLowerCase()))
            .map((a) => ({ amenity_name: a.label }));

        if (missingDefaults.length > 0) {
            await supabase.from("amenities").insert(missingDefaults);
        }

        const { data: finalData } = await supabase
            .from("amenities")
            .select("amenity_id, amenity_name")
            .order("amenity_name");

        const iconMap = new Map(DEFAULT_AMENITIES.map((a) => [a.label.trim().toLowerCase(), a.icon]));
        const mapped = (finalData ?? existing).map((a) => ({
            ...a,
            icon: iconMap.get(a.amenity_name.trim().toLowerCase()) ?? "✨",
        }));

        setAmenities(mapped);
    };

    const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleAddressChange = (city: string, district: string, ward: string) => {
        setForm(prev => ({ ...prev, city, district, ward }));
        setLatitude(null);
        setLongitude(null);
    };

    const handleLocationChange = (value: { latitude: number | null; longitude: number | null }) => {
        setLatitude(value.latitude);
        setLongitude(value.longitude);
    };

    const handleReverseGeocode = (data: {
        city?: string;
        district?: string;
        ward?: string;
        address_detail?: string;
        full_address?: string;
    }) => {
        if (data.city) setForm(prev => ({ ...prev, city: data.city ?? prev.city }));
        if (data.district) setForm(prev => ({ ...prev, district: data.district ?? prev.district }));
        if (data.ward) setForm(prev => ({ ...prev, ward: data.ward ?? prev.ward }));
        if (data.address_detail) {
            setForm(prev => ({ ...prev, address_detail: data.address_detail ?? prev.address_detail }));
            setAddressDetailHint(data.address_detail);
        }
    };

    const toggleAmenity = (id: string) =>
        setForm(prev => ({
            ...prev,
            selectedAmenityIds: prev.selectedAmenityIds.includes(id)
                ? prev.selectedAmenityIds.filter(a => a !== id)
                : [...prev.selectedAmenityIds, id],
        }));

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const mapped = files.map((file) => ({ file, is360: upload360Mode }));
        const newFiles = [...form.images, ...mapped].slice(0, 8);
        update("images", newFiles);
        setPreviews(newFiles.map((item) => URL.createObjectURL(item.file)));
    };

    const removeImage = (index: number) => {
        const newFiles = form.images.filter((_, i) => i !== index);
        update("images", newFiles);
        setPreviews(newFiles.map((item) => URL.createObjectURL(item.file)));
    };

    const validateStep = (s: number): string | null => {
        if (s === 1) {
            if (!form.post_title.trim()) return "Vui lòng nhập tiêu đề bài đăng.";
            if (!form.room_price || Number(form.room_price) <= 0) return "Vui lòng nhập giá thuê hợp lệ.";
            if (!form.room_area || Number(form.room_area) <= 0) return "Vui lòng nhập diện tích hợp lệ.";
            if (!form.city.trim()) return "Vui lòng chọn tỉnh / thành phố.";
            if (!form.district.trim()) return "Vui lòng chọn quận / huyện.";
            if (!form.ward.trim()) return "Vui lòng chọn phường / xã.";
            if (latitude === null || longitude === null) return "Vui lòng chọn vị trí trên mini map.";
        }
        if (s === 2) {
            if (!form.room_description.trim()) return "Vui lòng nhập mô tả căn phòng.";
        }
        return null;
    };

    const nextStep = () => {
        const err = validateStep(step);
        if (err) { setError(err); return; }
        setError(null);
        setStep(s => Math.min(s + 1, 3));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const prevStep = () => { setError(null); setStep(s => Math.max(s - 1, 1)); };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Bạn cần đăng nhập để đăng tin.");

            const fullAddress = [form.address_detail, form.ward, form.district, form.city].filter(Boolean).join(", ");

            const { data: locationData, error: locErr } = await supabase
                .from("locations")
                .insert({ city: form.city, district: form.district, ward: form.ward })
                .select("location_id")
                .single();
            if (locErr) throw new Error("Lỗi tạo địa điểm: " + locErr.message);

            const roomTypeLabel = ROOM_TYPES.find(t => t.value === form.room_type)?.label ?? "";
            const { data: typeData } = await supabase
                .from("roomtypes").select("room_type_id")
                .eq("room_type_name", roomTypeLabel).maybeSingle();

            const { data: roomData, error: roomErr } = await supabase
                .from("rooms")
                .insert({
                    room_price: Number(form.room_price),
                    room_area: Number(form.room_area),
                    room_description: form.room_description,
                    room_status: true,
                    room_type_id: typeData?.room_type_id ?? null,
                    location_id: locationData.location_id,
                    owner_id: user.id,
                    vr_url: form.vr_url || null,
                    address_detail: form.address_detail || null,
                    full_address: fullAddress || null,
                    latitude,
                    longitude,
                })
                .select("room_id")
                .single();
            if (roomErr) throw new Error("Lỗi tạo phòng: " + roomErr.message);

            const realIds = form.selectedAmenityIds.filter(id => !id.startsWith("default_"));
            if (realIds.length > 0) {
                await supabase.from("roomamenities").insert(
                    realIds.map(id => ({ room_id: roomData.room_id, amenity_id: id }))
                );
            }

            if (form.images.length > 0) {
                const uploadErrors: string[] = [];
                for (const image of form.images) {
                    const result = await uploadRoomImage(image.file, roomData.room_id, image.is360);
                    if (result.error) uploadErrors.push(result.error);
                }
                if (uploadErrors.length > 0) {
                    setError("Lỗi upload ảnh: " + uploadErrors.join("; "));
                    return;
                }
            }

            const { data: postData, error: postErr } = await supabase
                .from("posts")
                .insert({ post_title: form.post_title, room_id: roomData.room_id, user_id: user.id })
                .select("post_id").single();
            if (postErr) throw new Error("Lỗi tạo bài đăng: " + postErr.message);

            router.push(`/rooms/${postData.post_id}`);
        } catch (e: unknown) {
            setError("Đăng tin thất bại: " + (e instanceof Error ? e.message : "Lỗi không xác định"));
        } finally {
            setLoading(false);
        }
    };

    if (userRole === "renter") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl p-12 text-center max-w-md shadow-xl border border-gray-100">
                    <span className="text-6xl">🔑</span>
                    <h2 className="text-2xl font-black text-gray-900 mt-4 mb-2">Bạn là người thuê</h2>
                    <p className="text-gray-500 mb-6">Chỉ chủ trọ mới có thể đăng tin. Hãy cập nhật vai trò trong hồ sơ.</p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">Cập nhật hồ sơ</Link>
                        <Link href="/" className="border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all">Về trang chủ</Link>
                    </div>
                </div>
            </div>
        );
    }

    const normalImages = form.images.filter((image) => !image.is360);
    const images360 = form.images.filter((image) => image.is360);

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="text-sm text-gray-400 hover:text-blue-600 font-medium">← Về trang chủ</Link>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-3 tracking-tight">Đăng tin cho thuê</h1>
                    <p className="text-gray-500 mt-1 font-medium">Điền đầy đủ để tiếp cận nhiều người thuê hơn.</p>
                </div>

                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 flex-1">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                step > s.id ? "bg-green-500 text-white" :
                                step === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" :
                                "bg-gray-200 text-gray-400"
                            }`}>
                                {step > s.id ? "✓" : s.id}
                            </div>
                            <span className={`text-xs font-bold hidden sm:block truncate ${step === s.id ? "text-blue-600" : "text-gray-400"}`}>
                                {s.label}
                            </span>
                            {i < STEPS.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-1 rounded-full ${step > s.id ? "bg-green-400" : "bg-gray-200"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-red-500 text-lg shrink-0">⚠️</span>
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900">📋 Thông tin cơ bản</h2>

                            <Field label="Tiêu đề bài đăng *">
                                <input type="text" value={form.post_title} maxLength={120}
                                    onChange={e => update("post_title", e.target.value)}
                                    placeholder="VD: Phòng trọ cao cấp gần HUTECH, đầy đủ nội thất..."
                                    className={inputCls} />
                                <p className="text-xs text-gray-400 mt-1 text-right">{form.post_title.length}/120</p>
                            </Field>

                            <Field label="Loại hình cho thuê *">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {ROOM_TYPES.map(t => (
                                        <button key={t.value} type="button" onClick={() => update("room_type", t.value)}
                                            className={`p-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                                                form.room_type === t.value
                                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                            }`}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Giá thuê / tháng (đ) *">
                                    <div className="relative">
                                        <input type="number" value={form.room_price} min={0}
                                            onChange={e => update("room_price", e.target.value)}
                                            placeholder="3000000" className={inputCls + " pr-10"} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">đ</span>
                                    </div>
                                    {form.room_price && Number(form.room_price) > 0 && (
                                        <p className="text-xs text-blue-600 font-bold mt-1">
                                            ≈ {Number(form.room_price).toLocaleString("vi-VN")} đ
                                        </p>
                                    )}
                                </Field>
                                <Field label="Diện tích (m²) *">
                                    <div className="relative">
                                        <input type="number" value={form.room_area} min={0}
                                            onChange={e => update("room_area", e.target.value)}
                                            placeholder="25" className={inputCls + " pr-12"} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">m²</span>
                                    </div>
                                </Field>
                            </div>

                            <div>
                                <h3 className="text-base font-black text-gray-900 mb-4">📍 Địa chỉ</h3>
                                <VietnamAddressSelect
                                    city={form.city}
                                    district={form.district}
                                    ward={form.ward}
                                    onAddressChange={handleAddressChange}
                                    required
                                />
                            </div>

                            <Field label="Số nhà / Tên đường">
                                <input type="text" value={form.address_detail}
                                    onChange={e => update("address_detail", e.target.value)}
                                    placeholder="VD: 123 Đường Hà Huy Giáp" className={inputCls} />
                            </Field>

                            <PostLocationPicker
                                addressDetail={form.address_detail}
                                city={form.city}
                                district={form.district}
                                ward={form.ward}
                                latitude={latitude}
                                longitude={longitude}
                                onChange={handleLocationChange}
                                onReverseGeocode={handleReverseGeocode}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900">✨ Tiện ích phòng</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenities.map(a => {
                                    const selected = form.selectedAmenityIds.includes(a.amenity_id);
                                    return (
                                        <button key={a.amenity_id} type="button" onClick={() => toggleAmenity(a.amenity_id)}
                                            className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all text-left ${
                                                selected ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                                            }`}>
                                            <span className="text-lg">{a.icon}</span>
                                            <span className="truncate">{a.amenity_name}</span>
                                            {selected && <span className="ml-auto text-blue-600 text-xs">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.selectedAmenityIds.length > 0 && (
                                <p className="text-xs text-blue-600 font-bold">Đã chọn {form.selectedAmenityIds.length} tiện ích</p>
                            )}

                            <h3 className="text-base font-black text-gray-900 pt-2">📝 Mô tả căn phòng *</h3>
                            <textarea value={form.room_description} rows={6} maxLength={2000}
                                onChange={e => update("room_description", e.target.value)}
                                placeholder={"Mô tả chi tiết...\nVD: Phòng rộng 25m², thoáng mát, đầy đủ nội thất..."}
                                className={inputCls + " resize-none leading-relaxed"} />
                            <p className="text-xs text-gray-400 text-right">{form.room_description.length}/2000</p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900">📸 Hình ảnh phòng</h2>
                            <p className="text-sm text-gray-500 -mt-4">Tối đa 8 ảnh. Ảnh đầu tiên là ảnh bìa.</p>

                            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setUpload360Mode(false)}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                                        !upload360Mode
                                            ? "bg-white text-blue-600 shadow-md"
                                            : "text-gray-600 hover:text-gray-700"
                                    }`}
                                >
                                    📸 Ảnh thường ({normalImages.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUpload360Mode(true)}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                                        upload360Mode
                                            ? "bg-white text-blue-600 shadow-md"
                                            : "text-gray-600 hover:text-gray-700"
                                    }`}
                                >
                                    🌐 Ảnh 360° ({images360.length})
                                </button>
                            </div>

                            <div onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                                    upload360Mode
                                        ? "border-purple-300 bg-purple-50/50 hover:bg-purple-50"
                                        : "border-blue-300 bg-blue-50/50 hover:bg-blue-50"
                                }`}>
                                <p className="text-4xl mb-3">{upload360Mode ? "🌐" : "🖼️"}</p>
                                <p className={`font-bold ${upload360Mode ? "text-purple-700" : "text-blue-700"}`}>
                                    Nhấp để chọn ảnh {upload360Mode ? "360°" : "thường"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — tối đa 8 ảnh</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                            </div>

                            {form.images.length > 0 && (
                                <div className="grid grid-cols-4 gap-3">
                                    {form.images.map((image, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                                            {i === 0 && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">BÌA</span>}
                                            {image.is360 && <span className="absolute bottom-1 left-1 bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">360°</span>}
                                            <button type="button" onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <h3 className="text-base font-black text-gray-900 pt-2">🥽 Tour VR 360° (tuỳ chọn)</h3>
                            <Field label="Đường link VR / ảnh 360°">
                                <input type="url" value={form.vr_url} onChange={e => update("vr_url", e.target.value)}
                                    placeholder="https://..." className={inputCls} />
                                <p className="text-xs text-gray-500 mt-2">✓ Hỗ trợ: Google Maps Embed, Matterport, YouTube 360°</p>
                            </Field>

                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-3">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Xem lại trước khi đăng</p>
                                <SummaryRow label="Tiêu đề" value={form.post_title} />
                                <SummaryRow label="Loại phòng" value={ROOM_TYPES.find(t => t.value === form.room_type)?.label ?? ""} />
                                <SummaryRow label="Giá thuê" value={Number(form.room_price).toLocaleString("vi-VN") + " đ/tháng"} />
                                <SummaryRow label="Diện tích" value={form.room_area + " m²"} />
                                <SummaryRow label="Địa chỉ" value={[form.address_detail, form.ward, form.district, form.city].filter(Boolean).join(", ")} />
                                <SummaryRow label="Tiện ích" value={
                                    form.selectedAmenityIds.length > 0
                                        ? form.selectedAmenityIds.map(id => amenities.find(a => a.amenity_id === id)?.amenity_name ?? "").filter(Boolean).join(", ")
                                        : "Chưa chọn"
                                } />
                                <SummaryRow label="Số ảnh" value={`${form.images.length} ảnh (${images360.length} ảnh 360°)`} />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {step > 1 && (
                            <button type="button" onClick={prevStep}
                                className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:border-gray-300 transition-all">
                                ← Quay lại
                            </button>
                        )}
                        {step < 3 ? (
                            <button type="button" onClick={nextStep}
                                className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-lg shadow-blue-200 active:scale-95">
                                Tiếp theo →
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={loading}
                                className="flex-1 py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                                {loading
                                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang đăng tin...</>
                                    : "🚀 ĐĂNG TIN NGAY"
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
