"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface UserProfile {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_role: "owner" | "renter";
  user_created_at: string;
  user_avatar?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    user_name: "",
    user_phone: "",
    user_role: "renter" as "owner" | "renter",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        router.push("/auth/login");
      }
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [success, error]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        user_name: data.user_name || "",
        user_phone: data.user_phone || "",
        user_role: data.user_role || "renter",
      });
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.user_name.trim()) {
        setError("Vui lòng nhập tên");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          user_name: formData.user_name,
          user_phone: formData.user_phone,
          user_role: formData.user_role,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      setSuccess("Cập nhật hồ sơ thành công!");
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      setError(err.message || "Lỗi khi cập nhật hồ sơ");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Lỗi khi đăng xuất");
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-500">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Hồ sơ của bạn</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản và cài đặt</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-red-500 text-lg mt-0.5">⚠️</span>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-emerald-600 text-lg mt-0.5">✅</span>
            <p className="text-emerald-700 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6">
          {/* Avatar Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-3xl text-white font-black mb-4">
              {profile?.user_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {!editing ? profile?.user_name : formData.user_name}
            </h2>
            <p className="text-gray-600 text-sm">{profile?.user_email}</p>
          </div>

          {/* Profile Info */}
          <div className="space-y-6 mb-8">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-2">Họ và tên</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-medium text-gray-900"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile?.user_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-2">Email</label>
              <p className="text-gray-900 font-medium">{profile?.user_email}</p>
              <p className="text-gray-500 text-xs mt-1">Email không thể thay đổi</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-2">Số điện thoại</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.user_phone}
                  onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-medium text-gray-900"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile?.user_phone || "Chưa cập nhật"}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-2">Vai trò</label>
              {editing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, user_role: "renter" })}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                      formData.user_role === "renter"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    🏠 Người thuê
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, user_role: "owner" })}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                      formData.user_role === "owner"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    🔑 Chủ trọ
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                  {profile?.user_role === "owner" ? "🔑 Chủ trọ" : "🏠 Người thuê"}
                </div>
              )}
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-2">Thành viên từ</label>
              <p className="text-gray-900 font-medium">
                {profile?.user_created_at
                  ? new Date(profile.user_created_at).toLocaleDateString("vi-VN")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all"
                >
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      user_name: profile?.user_name || "",
                      user_phone: profile?.user_phone || "",
                      user_role: profile?.user_role || "renter",
                    });
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-all"
                >
                  Hủy
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h3 className="font-black text-blue-900 mb-2">💡 Thông tin</h3>
          <p className="text-sm text-blue-800">
            {profile?.user_role === "owner"
              ? "Bạn là Chủ trọ. Có thể tạo bài đăng cho các phòng của bạn."
              : "Bạn là Người thuê. Có thể tìm kiếm và xem các phòng trên nền tảng."}
          </p>
        </div>
      </div>
    </div>
  );
}

