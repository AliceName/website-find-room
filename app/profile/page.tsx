"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    user_name: "",
    user_phone: "",
    user_role: "renter" as "owner" | "renter",
  });

  const memberSince = useMemo(() => {
    if (!profile?.user_created_at) return "—";
    return new Date(profile.user_created_at).toLocaleDateString("vi-VN");
  }, [profile?.user_created_at]);

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
    void fetchProfile(user.id);
  }, [user]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [success, error]);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        user_name: data.user_name || "",
        user_phone: data.user_phone || "",
        user_role: data.user_role || "renter",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setError(null);
      if (!formData.user_name.trim()) {
        setError("Vui lòng nhập tên");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          user_name: formData.user_name.trim(),
          user_phone: formData.user_phone.trim(),
          user_role: formData.user_role,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      setSuccess("Cập nhật hồ sơ thành công!");
      setEditing(false);
      void fetchProfile(user.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi đăng xuất");
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_100%)] px-4 pb-12 pt-24">
        <div className="mx-auto max-w-3xl animate-pulse space-y-5">
          <div className="h-28 rounded-[2rem] bg-white/80 shadow-sm" />
          <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
            <div className="h-[46rem] rounded-[2rem] bg-white/80 shadow-sm" />
            <div className="h-[14rem] rounded-[2rem] bg-white/80 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_100%)] px-4 pb-12 pt-24 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_90px_rgba(15,23,42,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Hồ sơ của bạn</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">Quản lý thông tin tài khoản và cài đặt</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Alerts */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <span className="mt-0.5 text-lg text-rose-500">⚠️</span>
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <span className="mt-0.5 text-lg text-emerald-600">✅</span>
                <p className="text-sm font-medium text-emerald-700">{success}</p>
              </div>
            )}

            {/* Profile Card */}
            <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50/60 p-5 shadow-sm sm:p-6">
              {/* Avatar Section */}
              <div className="mb-8 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black text-white shadow-lg shadow-blue-200">
                  {profile?.user_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <h2 className="mb-1 mt-4 text-2xl font-black text-slate-900">
                  {!editing ? profile?.user_name : formData.user_name}
                </h2>
                <p className="text-sm text-slate-600">{profile?.user_email}</p>
              </div>

              {/* Profile Info */}
              <div className="mb-8 space-y-6">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-700">Họ và tên</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.user_name}
                      onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{profile?.user_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-700">Email</label>
                  <p className="font-medium text-slate-900">{profile?.user_email}</p>
                  <p className="mt-1 text-xs text-slate-500">Email không thể thay đổi</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-700">Số điện thoại</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.user_phone}
                      onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{profile?.user_phone || "Chưa cập nhật"}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-700">Vai trò</label>
                  {editing ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFormData({ ...formData, user_role: "renter" })}
                        className={`flex-1 rounded-2xl px-4 py-3 font-bold transition-all duration-200 ${
                          formData.user_role === "renter"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        🏠 Người thuê
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, user_role: "owner" })}
                        className={`flex-1 rounded-2xl px-4 py-3 font-bold transition-all duration-200 ${
                          formData.user_role === "owner"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        🔑 Chủ trọ
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                      {profile?.user_role === "owner" ? "🔑 Chủ trọ" : "🏠 Người thuê"}
                    </div>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-700">Thành viên từ</label>
                  <p className="font-medium text-slate-900">{memberSince}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                {!editing ? (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex-1 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex-1 rounded-2xl bg-rose-600 px-6 py-3 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
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
                      className="flex-1 rounded-2xl bg-slate-200 px-6 py-3 font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-300"
                    >
                      Hủy
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-6 rounded-[1.75rem] border border-blue-100 bg-blue-50 p-6">
              <h3 className="mb-2 font-black text-blue-900">💡 Thông tin</h3>
              <p className="text-sm text-blue-800">
                {profile?.user_role === "owner"
                  ? "Bạn là Chủ trọ. Có thể tạo bài đăng cho các phòng của bạn."
                  : "Bạn là Người thuê. Có thể tìm kiếm và xem các phòng trên nền tảng."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

