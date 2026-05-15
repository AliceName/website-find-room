"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { uploadRoomImage } from "@/lib/services/storage.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VietnamAddressSelect from "@/components/common/VietnamAddressSelect";
import { Sparkles, ArrowLeft, Check } from "lucide-react";

const PostLocationPicker = dynamic(
    () => import("@/components/map/PostLocationPicker"),
    { ssr: false }
);

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

export default function PostPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [upload360Mode, setUpload360Mode] = useState(false);
    const [amenities, setAmenities] = useState<AmenityOption[]>([]);
    const [userRole, setUserRole] = useState<"owner" | "renter" | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    const [form, setForm] = useState({
        post_title: "",
        room_type: "phong_tro",
        room_price: "",
        room_area: "",
        city: "",
        district: "",
        ward: "",
        address_detail: "",
        selectedAmenityIds: [] as string[],
        room_description: "",
        vr_url: "",
        images: [] as Array<{ file: File; is360: boolean }>,
    });

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.push("/auth/login");
                return;
            }
            supabase
                .from("users")
                .select("user_role")
                .eq("user_id", user.id)
                .single()
                .then(({ data }) => setUserRole(data?.user_role ?? null));
        });
        loadAmenities();
    }, [router]);

    const loadAmenities = async () => {
        const { data } = await supabase
            .from("amenities")
            .select("amenity_id, amenity_name")
            .order("amenity_name");

        if (data && data.length > 0) {
            setAmenities(data);
        } else {
            setAmenities(DEFAULT_AMENITIES.map((a, i) => ({
                amenity_id: `default_${i}`,
                amenity_name: a.label,
                icon: a.icon,
            })));
        }
    };

    const update = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const toggleAmenity = (id: string) => {
        setForm(prev => ({
            ...prev,
            selectedAmenityIds: prev.selectedAmenityIds.includes(id)
                ? prev.selectedAmenityIds.filter(a => a !== id)
                : [...prev.selectedAmenityIds, id],
        }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const mapped = files.map(file => ({ file, is360: upload360Mode }));
        const newFiles = [...form.images, ...mapped].slice(0, 8);

        update("images", newFiles);
        setPreviews(newFiles.map(img => URL.createObjectURL(img.file)));
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        const newFiles = form.images.filter((_, i) => i !== index);
        update("images", newFiles);
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = (s: number): string | null => {
        if (s === 1) {
            if (!form.post_title.trim()) return "Vui lòng nhập tiêu đề bài đăng.";
            if (!form.room_price || Number(form.room_price) <= 0) return "Vui lòng nhập giá thuê hợp lệ.";
            if (!form.room_area || Number(form.room_area) <= 0) return "Vui lòng nhập diện tích hợp lệ.";
            if (!form.city.trim()) return "Vui lòng chọn tỉnh / thành phố.";
            if (!form.district.trim()) return "Vui lòng chọn quận / huyện.";
            if (!form.ward.trim()) return "Vui lòng chọn phường / xã.";
            if (latitude === null || longitude === null) return "Vui lòng chọn vị trí trên bản đồ.";
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

    const prevStep = () => {
        setError(null);
        setStep(s => Math.max(s - 1, 1));
    };

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
                for (const image of form.images) {
                    await uploadRoomImage(image.file, roomData.room_id, image.is360);
                }
            }

            const { data: postData, error: postErr } = await supabase
                .from("posts")
                .insert({ post_title: form.post_title, room_id: roomData.room_id, user_id: user.id })
                .select("post_id").single();
            if (postErr) throw new Error("Lỗi tạo bài đăng: " + postErr.message);

            router.push(`/rooms/${postData.post_id}`);
        } catch (e: any) {
            setError("Đăng tin thất bại: " + (e.message || "Lỗi không xác định"));
        } finally {
            setLoading(false);
        }
    };

    if (userRole === "renter") {
        return (
            <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center px-4">
                <div className="max-w-md rounded-3xl border border-sky-100 bg-white p-12 text-center shadow-xl">
                    <span className="text-6xl">🔑</span>
                    <h2 className="mt-6 text-2xl font-black text-slate-900">Bạn đang ở vai trò người thuê</h2>
                    <p className="mt-3 text-slate-600">Chỉ chủ trọ mới có thể đăng tin cho thuê.</p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Link href="/profile" className="rounded-2xl bg-[#0EA5E9] px-6 py-3 font-bold text-white hover:bg-[#0284C8]">Cập nhật hồ sơ</Link>
                        <Link href="/" className="rounded-2xl border border-slate-300 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">Về trang chủ</Link>
                    </div>
                </div>
            </div>
        );
    }

    const normalImages = form.images.filter((image) => !image.is360);
    const images360 = form.images.filter((image) => image.is360);

    return (
        <div className="relative min-h-screen bg-[#F0F9FF] text-slate-800 overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                <div className="absolute left-[-200px] top-[-150px] h-[550px] w-[550px] rounded-full bg-[#7DD3FC]/50 blur-[120px]" />
                <div className="absolute bottom-[-180px] right-[-180px] h-[500px] w-[500px] rounded-full bg-[#0EA5E9]/30 blur-[130px]" />
            </div>

            <div className="mx-auto max-w-2xl px-4 py-10">
                <div className="mb-8">
                    <Link href="/" className="flex items-center gap-2 text-sky-600 hover:text-[#0EA5E9] font-medium">
                        <ArrowLeft className="h-4 w-4" /> Về trang chủ
                    </Link>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Đăng tin cho thuê</h1>
                    <p className="mt-2 text-slate-600">Hãy tạo tin đăng chuyên nghiệp để thu hút người thuê.</p>
                </div>

                {/* Steps */}
                <div className="mb-10 flex items-center gap-3">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex flex-1 items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black transition-all ${
                                step > s.id ? "bg-emerald-500 text-white" :
                                step === s.id ? "bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] text-white shadow-lg" :
                                "bg-white border-2 border-slate-200 text-slate-400"
                            }`}>
                                {step > s.id ? <Check className="h-5 w-5" /> : s.id}
                            </div>
                            <span className={`font-semibold ${step === s.id ? "text-slate-900" : "text-slate-500"}`}>{s.label}</span>
                            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${step > s.id ? "bg-emerald-500" : "bg-slate-200"}`} />}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error}
                    </div>
                )}

                <div className="rounded-[32px] border border-sky-100 bg-white shadow-2xl p-8 md:p-10">
                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-black text-slate-900">📋 Thông tin cơ bản</h2>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Tiêu đề bài đăng *</label>
                                <input
                                    type="text"
                                    value={form.post_title}
                                    onChange={e => update("post_title", e.target.value)}
                                    placeholder="VD: Phòng trọ cao cấp gần HUTECH..."
                                    className="w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Loại phòng *</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {ROOM_TYPES.map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => update("room_type", t.value)}
                                            className={`p-4 rounded-2xl border-2 font-medium transition-all ${
                                                form.room_type === t.value
                                                    ? "border-[#0EA5E9] bg-sky-50 text-[#0EA5E9]"
                                                    : "border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Giá thuê (đ/tháng) *</label>
                                    <input
                                        type="number"
                                        value={form.room_price}
                                        onChange={e => update("room_price", e.target.value)}
                                        placeholder="3000000"
                                        className="w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Diện tích (m²) *</label>
                                    <input
                                        type="number"
                                        value={form.room_area}
                                        onChange={e => update("room_area", e.target.value)}
                                        placeholder="25"
                                        className="w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">📍 Địa chỉ</label>
                                <VietnamAddressSelect
                                    city={form.city}
                                    district={form.district}
                                    ward={form.ward}
                                    onAddressChange={(city, district, ward) => {
                                        update("city", city);
                                        update("district", district);
                                        update("ward", ward);
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Số nhà / Tên đường</label>
                                <input
                                    type="text"
                                    value={form.address_detail}
                                    onChange={e => update("address_detail", e.target.value)}
                                    placeholder="VD: 123 Đường Hà Huy Giáp"
                                    className="w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                />
                            </div>

                            <PostLocationPicker
                                addressDetail={form.address_detail}
                                city={form.city}
                                district={form.district}
                                ward={form.ward}
                                latitude={latitude}
                                longitude={longitude}
                                onChange={(val) => {
                                    setLatitude(val.latitude);
                                    setLongitude(val.longitude);
                                }}
                                onReverseGeocode={() => {}}
                            />
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-black text-slate-900">✨ Tiện ích phòng</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenities.map(a => {
                                    const selected = form.selectedAmenityIds.includes(a.amenity_id);
                                    return (
                                        <button
                                            key={a.amenity_id}
                                            type="button"
                                            onClick={() => toggleAmenity(a.amenity_id)}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                                                selected ? "border-[#0EA5E9] bg-sky-50 text-[#0EA5E9]" : "border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <span className="text-xl">{a.icon}</span>
                                            <span>{a.amenity_name}</span>
                                            {selected && <span className="ml-auto">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Mô tả căn phòng *</label>
                                <textarea
                                    value={form.room_description}
                                    rows={7}
                                    onChange={e => update("room_description", e.target.value)}
                                    placeholder="Mô tả chi tiết căn phòng..."
                                    className="w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none resize-y"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-black text-slate-900">📸 Hình ảnh & VR</h2>

                            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setUpload360Mode(false)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!upload360Mode ? "bg-white shadow text-[#0EA5E9]" : "text-slate-500"}`}
                                >
                                    Ảnh thường ({normalImages.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUpload360Mode(true)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${upload360Mode ? "bg-white shadow text-[#0EA5E9]" : "text-slate-500"}`}
                                >
                                    Ảnh 360° ({images360.length})
                                </button>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-sky-200 rounded-3xl p-12 text-center cursor-pointer hover:border-[#0EA5E9] transition-all bg-white"
                            >
                                <div className="text-4xl mb-4">📸</div>
                                <p className="font-bold text-slate-700">Nhấp để tải ảnh lên</p>
                                <p className="text-sm text-slate-500">Tối đa 8 ảnh</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                            </div>

                            {form.images.length > 0 && (
                                <div className="grid grid-cols-4 gap-3">
                                    {form.images.map((image, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-sky-200 group">
                                            <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                                            {image.is360 && <span className="absolute bottom-2 left-2 bg-purple-600 text-xs px-2 py-1 rounded text-white">360°</span>}
                                            <button
                                                onClick={() => removeImage(i)}
                                                className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Link VR 360° (tùy chọn)</label>
                                <input
                                    type="url"
                                    value={form.vr_url}
                                    onChange={e => update("vr_url", e.target.value)}
                                    placeholder="https://..."
                                    className="w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-10">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="flex-1 py-4 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                ← Quay lại
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] font-black text-white hover:brightness-105 shadow-lg shadow-sky-300"
                            >
                                Tiếp theo →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] font-black text-white hover:brightness-105 shadow-lg shadow-sky-300 disabled:opacity-70"
                            >
                                {loading ? "Đang đăng tin..." : "🚀 ĐĂNG TIN NGAY"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}