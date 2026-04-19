"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadMultipleRoomImages } from "@/lib/services/storage.service";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

// Default amenities nếu DB chưa có
const DEFAULT_AMENITIES = [
    { label: "Wifi", icon: "📶" },
    { label: "Máy lạnh", icon: "❄️" },
    { label: "Máy giặt", icon: "🫧" },
    { label: "Tủ lạnh", icon: "🧊" },
    { label: "Chỗ để xe", icon: "🛵" },
    { label: "An ninh 24/7", icon: "🔒" },
    { label: "Camera", icon: "📷" },
    { label: "Giờ tự do", icon: "🕐" },
    { label: "Bếp nấu ăn", icon: "🍳" },
    { label: "Nội thất", icon: "🛏️" },
    { label: "Thang máy", icon: "🛗" },
    { label: "Ban công", icon: "🌿" },
];

interface AmenityOption {
    amenity_id: string;
    amenity_name: string;
    icon?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">{label}</label>
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
    images: File[];
}

export default function PostPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [amenities, setAmenities] = useState<AmenityOption[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);

    const [form, setForm] = useState<FormData>({
        post_title: "",
        room_type: "phong_tro",
        room_price: "",
        room_area: "",
        city: "TP. Hồ Chí Minh",
        district: "",
        ward: "",
        address_detail: "",
        selectedAmenityIds: [],
        room_description: "",
        vr_url: "",
        images: [],
    });

    useEffect(() => {
        // Check auth
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { router.push("/auth/login"); return; }
            // Check role
            supabase.from("users").select("user_role").eq("user_id", user.id).single().then(({ data }) => {
                setUserRole(data?.user_role || null);
            });
        });

        // Load amenities from DB
        loadAmenities();
    }, [router]);

    const loadAmenities = async () => {
        const { data } = await supabase.from("amenities").select("amenity_id, amenity_name").order("amenity_name");

        if (data && data.length > 0) {
            // Map icons from default list
            const mapped = data.map(a => ({
                ...a,
                icon: DEFAULT_AMENITIES.find(d => d.label === a.amenity_name)?.icon || "✨"
            }));
            setAmenities(mapped);
        } else {
            // Nếu bảng amenities trống, dùng list mặc định với fake IDs
            setAmenities(DEFAULT_AMENITIES.map((a, i) => ({
                amenity_id: `default_${i}`,
                amenity_name: a.label,
                icon: a.icon,
            })));
        }
    };

    const update = (key: keyof FormData, value: FormData[keyof FormData]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const toggleAmenity = (id: string) =>
        setForm(prev => ({
            ...prev,
            selectedAmenityIds: prev.selectedAmenityIds.includes(id)
                ? prev.selectedAmenityIds.filter(a => a !== id)
                : [...prev.selectedAmenityIds, id],
        }));

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const newFiles = [...form.images, ...files].slice(0, 8);
        update("images", newFiles);
        setPreviews(newFiles.map(f => URL.createObjectURL(f)));
    };

    const removeImage = (index: number) => {
        const newFiles = form.images.filter((_, i) => i !== index);
        update("images", newFiles);
        setPreviews(newFiles.map(f => URL.createObjectURL(f)));
    };

    const validateStep = (s: number): string | null => {
        if (s === 1) {
            if (!form.post_title.trim()) return "Vui lòng nhập tiêu đề bài đăng.";
            if (!form.room_price || Number(form.room_price) <= 0) return "Vui lòng nhập giá thuê hợp lệ.";
            if (!form.room_area || Number(form.room_area) <= 0) return "Vui lòng nhập diện tích hợp lệ.";
            if (!form.district.trim()) return "Vui lòng nhập quận/huyện.";
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
    };

    const prevStep = () => { setError(null); setStep(s => Math.max(s - 1, 1)); };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Bạn cần đăng nhập để đăng tin.");

            // 1. Create location
            const { data: locationData, error: locErr } = await supabase
                .from("locations")
                .insert({
                    city: form.city || "TP. Hồ Chí Minh",
                    district: form.district,
                    ward: form.ward || "",
                })
                .select("location_id")
                .single();
            if (locErr) throw new Error("Lỗi tạo địa điểm: " + locErr.message);

            // 2. Get room_type_id
            const roomTypeLabel = ROOM_TYPES.find(t => t.value === form.room_type)?.label ?? "";
            const { data: typeData } = await supabase
                .from("roomtypes")
                .select("room_type_id")
                .eq("room_type_name", roomTypeLabel)
                .maybeSingle();

            // 3. Create room
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
                })
                .select("room_id")
                .single();
            if (roomErr) throw new Error("Lỗi tạo phòng: " + roomErr.message);

            // 4. Save amenities (only real IDs from DB, not fake default_ ones)
            const realAmenityIds = form.selectedAmenityIds.filter(id => !id.startsWith('default_'));
            if (realAmenityIds.length > 0) {
                const amenityInserts = realAmenityIds.map(id => ({
                    room_id: roomData.room_id,
                    amenity_id: id,
                }));
                await supabase.from("roomamenities").insert(amenityInserts);
            }

            // 5. Upload images using storage service
            if (form.images.length > 0) {
                const uploadResult = await uploadMultipleRoomImages(
                    form.images,
                    roomData.room_id
                );

                // Check for errors
                if (!uploadResult.success && uploadResult.errors) {
                    const errorMsgs = uploadResult.errors.join("; ");
                    console.warn("Lỗi upload ảnh: " + errorMsgs);
                    setError("Lỗi upload một số ảnh: " + errorMsgs);
                    return;
                }
            }

            // 6. Create post
            const { data: postData, error: postErr } = await supabase
                .from("posts")
                .insert({
                    post_title: form.post_title,
                    room_id: roomData.room_id,
                    user_id: user.id,
                })
                .select("post_id")
                .single();
            if (postErr) throw new Error("Lỗi tạo bài đăng: " + postErr.message);

            router.push(`/rooms/${postData.post_id}`);
        } catch (e: unknown) {
            let msg = "Lỗi không xác định.";
            if (e instanceof Error) msg = e.message;
            setError("Đăng tin thất bại: " + msg);
        } finally {
            setLoading(false);
        }
    };

    // Nếu là renter, không cho đăng (nhưng vẫn hiển thị form - check sau khi role load)
    if (userRole === 'renter') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl p-12 text-center max-w-md shadow-xl border border-gray-100">
                    <span className="text-6xl">🔑</span>
                    <h2 className="text-2xl font-black text-gray-900 mt-4 mb-2">Bạn là người thuê</h2>
                    <p className="text-gray-500 mb-6">
                        Chỉ chủ trọ mới có thể đăng tin. Hãy cập nhật vai trò trong hồ sơ của bạn.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">
                            Cập nhật hồ sơ
                        </Link>
                        <Link href="/" className="border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                            Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-sm text-gray-400 hover:text-blue-600 font-medium">← Về trang chủ</Link>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-3 tracking-tight">Đăng tin cho thuê</h1>
                    <p className="text-gray-500 mt-1 font-medium">Điền đầy đủ để tiếp cận nhiều người thuê hơn.</p>
                </div>

                {/* Step indicator */}
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

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
                    {/* BƯỚC 1 */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">📋 Thông tin cơ bản</h2>

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

                            <h3 className="text-base font-black text-gray-900 flex items-center gap-2 pt-2">📍 Địa chỉ</h3>

                            <Field label="Thành phố">
                                <input type="text" value={form.city} onChange={e => update("city", e.target.value)}
                                    placeholder="TP. Hồ Chí Minh" className={inputCls} />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Quận / Huyện *">
                                    <input type="text" value={form.district} onChange={e => update("district", e.target.value)}
                                        placeholder="VD: Quận 9" className={inputCls} />
                                </Field>
                                <Field label="Phường / Xã">
                                    <input type="text" value={form.ward} onChange={e => update("ward", e.target.value)}
                                        placeholder="VD: Long Thạnh Mỹ" className={inputCls} />
                                </Field>
                            </div>

                            <Field label="Số nhà / Tên đường">
                                <input type="text" value={form.address_detail}
                                    onChange={e => update("address_detail", e.target.value)}
                                    placeholder="VD: 123 Đường Hà Huy Giáp" className={inputCls} />
                            </Field>
                        </div>
                    )}

                    {/* BƯỚC 2 */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">✨ Tiện ích phòng</h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenities.map(a => {
                                    const selected = form.selectedAmenityIds.includes(a.amenity_id);
                                    return (
                                        <button key={a.amenity_id} type="button" onClick={() => toggleAmenity(a.amenity_id)}
                                            className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all text-left ${
                                                selected
                                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                            }`}>
                                            <span className="text-lg">{a.icon || "✨"}</span>
                                            <span className="truncate">{a.amenity_name}</span>
                                            {selected && <span className="ml-auto text-blue-600 text-xs">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {form.selectedAmenityIds.length > 0 && (
                                <p className="text-xs text-blue-600 font-bold">Đã chọn {form.selectedAmenityIds.length} tiện ích</p>
                            )}

                            <h3 className="text-base font-black text-gray-900 flex items-center gap-2 pt-2">📝 Mô tả căn phòng *</h3>

                            <textarea value={form.room_description} rows={6} maxLength={2000}
                                onChange={e => update("room_description", e.target.value)}
                                placeholder={"Mô tả chi tiết về phòng trọ...\n\nVD: Phòng rộng 25m², thoáng mát, đầy đủ nội thất, gần trường HUTECH..."}
                                className={inputCls + " resize-none leading-relaxed"} />
                            <p className="text-xs text-gray-400 text-right">{form.room_description.length}/2000</p>
                        </div>
                    )}

                    {/* BƯỚC 3 */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">📸 Hình ảnh phòng</h2>
                            <p className="text-sm text-gray-500 -mt-4">Tối đa 8 ảnh. Ảnh đầu tiên sẽ là ảnh bìa.</p>

                            <div onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-3xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-all">
                                <p className="text-4xl mb-3">🖼️</p>
                                <p className="font-bold text-blue-700">Nhấp để chọn ảnh</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — tối đa 8 ảnh</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                            </div>

                            {previews.length > 0 && (
                                <div className="grid grid-cols-4 gap-3">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                            {i === 0 && (
                                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">BÌA</span>
                                            )}
                                            <button type="button" onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <h3 className="text-base font-black text-gray-900 flex items-center gap-2 pt-2">🥽 Tour VR 360° (tuỳ chọn)</h3>
                            <Field label="Đường link VR / ảnh 360°">
                                <input type="url" value={form.vr_url} onChange={e => update("vr_url", e.target.value)}
                                    placeholder="https://..." className={inputCls} />
                                <p className="text-xs text-gray-500 mt-2 space-y-1">
                                    <span className="block">✓ Hỗ trợ: Google Maps Embed, Matterport, YouTube 360°</span>
                                    <span className="block text-gray-400">Lưu ý: Dùng URL nhúng (embed), không dùng link chia sẻ thông thường</span>
                                </p>
                            </Field>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-3">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Xem lại trước khi đăng</p>
                                <SummaryRow label="Tiêu đề" value={form.post_title} />
                                <SummaryRow label="Loại phòng" value={ROOM_TYPES.find(t => t.value === form.room_type)?.label ?? ""} />
                                <SummaryRow label="Giá thuê" value={Number(form.room_price).toLocaleString("vi-VN") + " đ/tháng"} />
                                <SummaryRow label="Diện tích" value={form.room_area + " m²"} />
                                <SummaryRow label="Địa chỉ" value={[form.ward, form.district, form.city].filter(Boolean).join(", ")} />
                                <SummaryRow label="Tiện ích" value={
                                    form.selectedAmenityIds.length > 0
                                        ? form.selectedAmenityIds.map(id => amenities.find(a => a.amenity_id === id)?.amenity_name ?? "").filter(Boolean).join(", ")
                                        : "Chưa chọn"
                                } />
                                <SummaryRow label="Số ảnh" value={`${form.images.length} ảnh`} />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
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
