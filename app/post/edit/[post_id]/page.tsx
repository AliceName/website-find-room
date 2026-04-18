"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AMENITY_OPTIONS = [
  { id: "wifi", label: "Wifi", icon: "📶" },
  { id: "ac", label: "Máy lạnh", icon: "❄️" },
  { id: "wm", label: "Máy giặt", icon: "🫧" },
  { id: "fridge", label: "Tủ lạnh", icon: "🧊" },
  { id: "parking", label: "Chỗ để xe", icon: "🛵" },
  { id: "security", label: "An ninh 24/7", icon: "🔒" },
  { id: "camera", label: "Camera", icon: "📷" },
  { id: "free_time", label: "Giờ tự do", icon: "🕐" },
  { id: "kitchen", label: "Bếp nấu ăn", icon: "🍳" },
  { id: "bed", label: "Nội thất", icon: "🛏️" },
  { id: "elevator", label: "Thang máy", icon: "🛗" },
  { id: "balcony", label: "Ban công", icon: "🌿" },
];

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
  room_description: string;
  vr_url: string;
}

export default function EditPostPage({ params }: { params: { post_id: string } }) {
  const router = useRouter();
  const postId = params.post_id;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    post_title: "",
    room_type: "phong_tro",
    room_price: "",
    room_area: "",
    city: "TP. Hồ Chí Minh",
    district: "",
    ward: "",
    room_description: "",
    vr_url: "",
  });

  const [roomId, setRoomId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  // Check auth & fetch post data
  useEffect(() => {
    const initPage = async () => {
      // 1. Check auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth/login");
        return;
      }
      setUser(authUser);

      // 2. Fetch post and related data
      try {
        const { data: post, error: postErr } = await supabase
          .from("posts")
          .select("*")
          .eq("post_id", postId)
          .single();

        if (postErr || !post) {
          setError("Không tìm thấy bài đăng");
          setLoading(false);
          return;
        }

        // Check if user owns this post
        if (post.user_id !== authUser.id) {
          setError("Bạn không có quyền sửa bài đăng này");
          setLoading(false);
          return;
        }

        setRoomId(post.room_id);

        // 3. Fetch room data
        const { data: room, error: roomErr } = await supabase
          .from("rooms")
          .select("*")
          .eq("room_id", post.room_id)
          .single();

        if (roomErr || !room) {
          setError("Không tìm thấy thông tin phòng");
          setLoading(false);
          return;
        }

        setLocationId(room.location_id);

        // 4. Fetch location data
        const { data: location } = await supabase
          .from("locations")
          .select("*")
          .eq("location_id", room.location_id)
          .single();

        // 5. Get room type name
        let roomTypeValue = "phong_tro";
        if (room.room_type_id) {
          const { data: roomType } = await supabase
            .from("roomtypes")
            .select("room_type_name")
            .eq("room_type_id", room.room_type_id)
            .single();

          if (roomType) {
            const found = ROOM_TYPES.find((t) => t.label === roomType.room_type_name);
            roomTypeValue = found?.value || "phong_tro";
          }
        }

        // 6. Pre-fill form
        setForm({
          post_title: post.post_title || "",
          room_type: roomTypeValue,
          room_price: String(room.room_price || ""),
          room_area: String(room.room_area || ""),
          city: location?.city || "TP. Hồ Chí Minh",
          district: location?.district || "",
          ward: location?.ward || "",
          room_description: room.room_description || "",
          vr_url: room.vr_url || "",
        });

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
    const timer = setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [success, error]);

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!form.post_title.trim()) {
        setError("Vui lòng nhập tiêu đề bài đăng.");
        setSubmitting(false);
        return;
      }
      if (!form.room_price || Number(form.room_price) <= 0) {
        setError("Vui lòng nhập giá thuê hợp lệ.");
        setSubmitting(false);
        return;
      }
      if (!form.room_area || Number(form.room_area) <= 0) {
        setError("Vui lòng nhập diện tích hợp lệ.");
        setSubmitting(false);
        return;
      }
      if (!form.room_description.trim()) {
        setError("Vui lòng nhập mô tả căn phòng.");
        setSubmitting(false);
        return;
      }

      // 1. Update location
      if (locationId) {
        const { error: locErr } = await supabase
          .from("locations")
          .update({
            city: form.city,
            district: form.district,
            ward: form.ward,
          })
          .eq("location_id", locationId);

        if (locErr) throw new Error("Lỗi cập nhật địa điểm: " + locErr.message);
      }

      // 2. Get room_type_id
      const roomTypeLabel = ROOM_TYPES.find((t) => t.value === form.room_type)?.label ?? "";
      const { data: typeData } = await supabase
        .from("roomtypes")
        .select("room_type_id")
        .eq("room_type_name", roomTypeLabel)
        .maybeSingle();

      // 3. Update room
      if (roomId) {
        const { error: roomErr } = await supabase
          .from("rooms")
          .update({
            room_price: Number(form.room_price),
            room_area: Number(form.room_area),
            room_description: form.room_description,
            room_type_id: typeData?.room_type_id ?? null,
            vr_url: form.vr_url || null,
          })
          .eq("room_id", roomId);

        if (roomErr) throw new Error("Lỗi cập nhật phòng: " + roomErr.message);
      }

      // 4. Update post
      const { error: postErr } = await supabase
        .from("posts")
        .update({ post_title: form.post_title })
        .eq("post_id", postId);

      if (postErr) throw new Error("Lỗi cập nhật bài đăng: " + postErr.message);

      setSuccess("Cập nhật bài đăng thành công!");
      setTimeout(() => {
        router.push("/manage-posts");
      }, 1500);
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
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-3 tracking-tight">
            Sửa bài đăng
          </h1>
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

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Tiêu đề bài đăng
            </label>
            <input
              type="text"
              value={form.post_title}
              onChange={(e) => update("post_title", e.target.value)}
              placeholder="VD: Phòng trọ sạch đẹp gần HUTECH"
              className={inputCls}
            />
          </div>

          {/* Loại phòng */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Loại phòng
            </label>
            <select
              value={form.room_type}
              onChange={(e) => update("room_type", e.target.value)}
              className={inputCls}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Giá & Diện tích */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Giá thuê (triệu/tháng)
              </label>
              <input
                type="number"
                value={form.room_price}
                onChange={(e) => update("room_price", e.target.value)}
                placeholder="VD: 2.5"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Diện tích (m²)
              </label>
              <input
                type="number"
                value={form.room_area}
                onChange={(e) => update("room_area", e.target.value)}
                placeholder="VD: 25"
                className={inputCls}
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Thành phố
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Quận/Huyện
              </label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="VD: Quận 9"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Phường/Xã
              </label>
              <input
                type="text"
                value={form.ward}
                onChange={(e) => update("ward", e.target.value)}
                placeholder="VD: Phường Long Bình"
                className={inputCls}
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              value={form.room_description}
              onChange={(e) => update("room_description", e.target.value)}
              placeholder="Mô tả đặc điểm, tiện ích của phòng..."
              rows={4}
              className={inputCls}
            />
          </div>

          {/* URL VR */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Link tour ảo 360° (tùy chọn)
            </label>
            <input
              type="url"
              value={form.vr_url}
              onChange={(e) => update("vr_url", e.target.value)}
              placeholder="VD: https://..."
              className={inputCls}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-black text-base hover:bg-gray-50 transition-all"
            >
              HỦY
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-200"
            >
              {submitting ? "Đang cập nhật..." : "CẬP NHẬT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
