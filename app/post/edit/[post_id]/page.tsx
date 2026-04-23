"use client";

import { useState, useEffect, use, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import ImageUploader from "@/components/common/ImageUploader";
import VietnamAddressSelect from "@/components/common/VietnamAddressSelect";
import PostLocationPicker from "@/components/map/PostLocationPicker";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROOM_TYPES = [
    { value: "phong_tro", label: "Phòng trọ" },
    { value: "can_ho_mini", label: "Căn hộ mini" },
    { value: "chung_cu", label: "Chung cư" },
    { value: "nha_nguyen_can", label: "Nhà nguyên căn" },
    { value: "ky_tuc_xa", label: "Ký túc xá" },
];

const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

interface FormData {
    post_title: string;
    room_type: string;
    room_price: string;
    room_area: string;
    city: string;
    district: string;
    ward: string;
    address_detail: string;
    room_description: string;
    vr_url: string;
    room_status: boolean;
}

export default function EditPostPage({ params }: { params: Promise<{ post_id: string }> }) {
    const router = useRouter();
    const { post_id: postId } = use(params);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [addressDetailHint, setAddressDetailHint] = useState<string>("");

    const [form, setForm] = useState<FormData>({
        post_title: "",
        room_type: "phong_tro",
        room_price: "",
        room_area: "",
        city: "TP. Hồ Chí Minh",
        district: "",
        ward: "",
        address_detail: "",
        room_description: "",
        vr_url: "",
        room_status: true,
    });

    const [roomId, setRoomId] = useState<string | null>(null);
    const [locationId, setLocationId] = useState<string | null>(null);

    useEffect(() => {
        const initPage = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) { router.push("/auth/login"); return; }
            setUser(authUser);

            try {
                const { data: post, error: postErr } = await supabase
                    .from("posts")
                    .select("*")
                    .eq("post_id", postId)
                    .single();

                if (postErr || !post) { setError("Không tìm thấy bài đăng"); setLoading(false); return; }
                if (post.user_id !== authUser.id) { setError("Bạn không có quyền sửa bài đăng này"); setLoading(false); return; }

                setRoomId(post.room_id);

                const { data: room } = await supabase
                    .from("rooms")
                    .select("*")
                    .eq("room_id", post.room_id)
                    .single();

                if (!room) { setError("Không tìm thấy thông tin phòng"); setLoading(false); return; }

                setLocationId(room.location_id);

                const { data: location } = await supabase
                    .from("locations")
                    .select("*")
                    .eq("location_id", room.location_id)
                    .single();

                let roomTypeValue = "phong_tro";
                if (room.room_type_id) {
                    const { data: roomType } = await supabase
                        .from("roomtypes")
                        .select("room_type_name")
                        .eq("room_type_id", room.room_type_id)
                        .single();
                    if (roomType) {
                        const found = ROOM_TYPES.find(t => t.label === roomType.room_type_name);
                        roomTypeValue = found?.value || "phong_tro";
                    }
                }

                setForm({
                    post_title: post.post_title || "",
                    room_type: roomTypeValue,
                    room_price: String(room.room_price || ""),
                    room_area: String(room.room_area || ""),
                    city: location?.city || "TP. Hồ Chí Minh",
                    district: location?.district || "",
                    ward: location?.ward || "",
                    address_detail: room.full_address || room.address_detail || "",
                    room_description: room.room_description || "",
                    vr_url: room.vr_url || "",
                    room_status: room.room_status !== false,
                });

                setLatitude(room.latitude ?? null);
                setLongitude(room.longitude ?? null);

                setLoading(false);
            } catch (err: any) {
                setError(err.message || "Lỗi khi tải dữ liệu");
                setLoading(false);
            }
        };

        initPage();
    }, [postId, router]);

    useEffect(() => {
        if (!success && !error) return;
        const timer = setTimeout(() => { setSuccess(null); setError(null); }, 4000);
        return () => clearTimeout(timer);
    }, [success, error]);

    const update = (key: keyof FormData, value: string | boolean) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleAddressChange = (city: string, district: string, ward: string) => {
        setForm(prev => ({ ...prev, city, district, ward }));
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

    const handleResetPin = async () => {
        const query = [form.city, form.district, form.ward, form.address_detail].filter(Boolean).join(", ");
        if (!query) return;

        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.lat || !data?.lng) return;
        setLatitude(Number(data.lat));
        setLongitude(Number(data.lng));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (!form.post_title.trim()) throw new Error("Vui lòng nhập tiêu đề bài đăng.");
            if (!form.room_price || Number(form.room_price) <= 0) throw new Error("Vui lòng nhập giá thuê hợp lệ.");
            if (!form.room_area || Number(form.room_area) <= 0) throw new Error("Vui lòng nhập diện tích hợp lệ.");
            if (!form.room_description.trim()) throw new Error("Vui lòng nhập mô tả căn phòng.");
            if (!form.city.trim()) throw new Error("Vui lòng chọn tỉnh / thành phố.");
            if (!form.district.trim()) throw new Error("Vui lòng chọn quận / huyện.");
            if (!form.ward.trim()) throw new Error("Vui lòng chọn phường / xã.");
            if (latitude === null || longitude === null) throw new Error("Vui lòng chọn vị trí trên mini map.");

            if (locationId) {
                const { error: locErr } = await supabase
                    .from("locations")
                    .update({ city: form.city, district: form.district, ward: form.ward })
                    .eq("location_id", locationId);
                if (locErr) throw new Error("Lỗi cập nhật địa điểm: " + locErr.message);
            }

            const roomTypeLabel = ROOM_TYPES.find(t => t.value === form.room_type)?.label ?? "";
            const { data: typeData } = await supabase
                .from("roomtypes")
                .select("room_type_id")
                .eq("room_type_name", roomTypeLabel)
                .maybeSingle();

            if (roomId) {
                const { error: roomErr } = await supabase
                    .from("rooms")
                    .update({
                        room_price: Number(form.room_price),
                        room_area: Number(form.room_area),
                        room_description: form.room_description,
                        room_type_id: typeData?.room_type_id ?? null,
                        room_status: form.room_status,
                        vr_url: form.vr_url || null,
                        address_detail: form.address_detail || null,
                        full_address: [form.address_detail, form.ward, form.district, form.city].filter(Boolean).join(", "),
                        latitude,
                        longitude,
                    })
                    .eq("room_id", roomId);
                if (roomErr) throw new Error("Lỗi cập nhật phòng: " + roomErr.message);
            }

            const { error: postErr } = await supabase
                .from("posts")
                .update({
                    post_title: form.post_title,
                    post_update_at: new Date().toISOString(),
                })
                .eq("post_id", postId);
            if (postErr) throw new Error("Lỗi cập nhật bài đăng: " + postErr.message);

            setSuccess("Cập nhật bài đăng thành công!");
            setTimeout(() => router.push("/manage-posts"), 1500);
        } catch (err: any) {
            setError(err.message || "Lỗi không xác định");
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <Link href="/manage-posts" className="text-sm text-gray-400 hover:text-blue-600 font-medium">
                        ← Quay lại quản lý bài đăng
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 mt-3 tracking-tight">Sửa bài đăng</h1>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-emerald-600 text-lg">✅</span>
                        <p className="text-emerald-700 text-sm font-medium">{success}</p>
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Tiêu đề bài đăng</label>
                        <input type="text" value={form.post_title} onChange={e => update("post_title", e.target.value)}
                            placeholder="VD: Phòng trọ sạch đẹp gần HUTECH" className={inputCls} />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Loại phòng</label>
                        <select value={form.room_type} onChange={e => update("room_type", e.target.value)} className={inputCls}>
                            {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Trạng thái phòng</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { val: true, label: "✓ Còn phòng", color: "green" },
                                { val: false, label: "✗ Hết phòng", color: "gray" },
                            ].map(s => (
                                <button
                                    key={String(s.val)}
                                    type="button"
                                    onClick={() => update("room_status", s.val)}
                                    className={`p-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                                        form.room_status === s.val
                                            ? s.val ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-400 bg-gray-50 text-gray-700'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Giá thuê (đ/tháng)</label>
                            <input type="number" value={form.room_price} onChange={e => update("room_price", e.target.value)}
                                placeholder="3000000" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Diện tích (m²)</label>
                            <input type="number" value={form.room_area} onChange={e => update("room_area", e.target.value)}
                                placeholder="25" className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">📍 Địa chỉ</label>
                        <VietnamAddressSelect
                            city={form.city}
                            district={form.district}
                            ward={form.ward}
                            onAddressChange={handleAddressChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Số nhà / Tên đường</label>
                        <input
                            type="text"
                            value={form.address_detail}
                            onChange={e => update("address_detail", e.target.value)}
                            placeholder="VD: 123 Đường Hà Huy Giáp"
                            className={inputCls}
                        />
                    </div>

                    <div>
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

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Mô tả chi tiết</label>
                        <textarea value={form.room_description} onChange={e => update("room_description", e.target.value)}
                            placeholder="Mô tả đặc điểm, tiện ích của phòng..." rows={4} className={inputCls} />
                    </div>

                    {roomId && (
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">📸 Quản lý hình ảnh</label>
                            <ImageUploader 
                                roomId={roomId}
                                maxFiles={8}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Link tour ảo 360° (tùy chọn)</label>
                        <input type="url" value={form.vr_url} onChange={e => update("vr_url", e.target.value)}
                            placeholder="VD: https://..." className={inputCls} />
                        <p className="text-xs text-gray-500 mt-2 space-y-1">
                            <span className="block">✓ Hỗ trợ: Google Maps Embed, Matterport, YouTube 360°</span>
                            <span className="block text-gray-400">Lưu ý: Dùng URL nhúng (embed), không dùng link chia sẻ thông thường</span>
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => router.back()}
                            className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-2xl font-black text-base hover:bg-gray-50 transition-all">
                            HỦY
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={submitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-200">
                            {submitting ? "Đang cập nhật..." : "CẬP NHẬT"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
