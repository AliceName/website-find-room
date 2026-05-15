"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  LogOut,
  Pencil,
  Save,
  X,
  Sparkles,
} from "lucide-react";

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
      if (!user) router.push("/auth/login");
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
        setError("Vui lòng nhập họ và tên");
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

      setSuccess("Cập nhật hồ sơ thành công ✨");
      setEditing(false);
      void fetchProfile(user.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user || loading) {
    return (
      <div className="relative min-h-screen bg-[#F0F9FF] flex items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-sky-200 border-t-[#0EA5E9]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F0F9FF] px-4 pb-20 pt-24 text-slate-800">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute left-[-150px] top-[-150px] h-[500px] w-[500px] rounded-full bg-[#7DD3FC]/50 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-120px] h-[450px] w-[450px] rounded-full bg-[#0EA5E9]/30 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-[36px] border border-sky-100 bg-white shadow-xl"
        >
          <div className="relative px-8 py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 py-2 text-sm font-semibold text-[#0EA5E9]">
                  <Sparkles className="h-4 w-4" />
                  Hồ sơ cá nhân
                </div>

                <h1 className="mt-5 text-5xl font-black tracking-tight text-slate-900">
                  Thông tin của bạn
                </h1>

                <p className="mt-3 max-w-xl text-lg text-slate-600">
                  Quản lý thông tin tài khoản một cách dễ dàng và hiện đại.
                </p>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-5"
              >
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] text-5xl font-black text-white shadow-[0_0_60px_rgba(14,165,233,0.4)]">
                  {profile?.user_name?.charAt(0).toUpperCase() || "U"}
                </div>

                <div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {profile?.user_name}
                  </h2>
                  <p className="text-slate-600">{profile?.user_email}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-600"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700"
          >
            {success}
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-sky-100 bg-white p-8 shadow-xl"
          >
            <div className="text-center">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] text-6xl font-black text-white shadow-xl">
                {profile?.user_name?.charAt(0).toUpperCase() || "U"}
              </div>

              <h2 className="mt-6 text-3xl font-black text-slate-900">
                {profile?.user_name}
              </h2>
              <p className="text-slate-600">{profile?.user_email}</p>
            </div>

            <div className="mt-10 space-y-4">
              <div className="rounded-3xl bg-sky-50 p-6">
                <div className="flex items-center gap-4">
                  <CalendarDays className="h-6 w-6 text-[#0EA5E9]" />
                  <div>
                    <p className="text-sm text-slate-500">Thành viên từ</p>
                    <p className="font-semibold text-slate-900">{memberSince}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-sky-50 p-6">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-[#0EA5E9]" />
                  <div>
                    <p className="text-sm text-slate-500">Vai trò</p>
                    <p className="font-semibold text-slate-900">
                      {profile?.user_role === "owner" ? "🔑 Chủ trọ" : "🏠 Người thuê"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-10 w-full flex items-center justify-center gap-3 rounded-2xl bg-red-500 py-4 font-bold text-white transition-all hover:bg-red-600 active:scale-95"
            >
              <LogOut className="h-5 w-5" />
              Đăng xuất
            </button>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-sky-100 bg-white p-8 shadow-xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Thông tin cá nhân</h2>
                <p className="text-slate-600">Cập nhật thông tin của bạn</p>
              </div>

              {!editing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] px-6 py-3.5 font-bold text-white shadow-lg shadow-sky-500/30"
                >
                  <Pencil className="h-4 w-4" />
                  Chỉnh sửa
                </motion.button>
              )}
            </div>

            <div className="space-y-8">
              {/* Name, Email, Phone, Role fields... */}
              {/* (Giữ nguyên logic, chỉ thay style) */}

              {/* Name */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <User className="h-4 w-4" />
                  Họ và tên
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-6 py-4 text-slate-900 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-200 outline-none"
                  />
                ) : (
                  <div className="rounded-2xl border border-sky-100 bg-slate-50 px-6 py-4">
                    {profile?.user_name}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <div className="rounded-2xl border border-sky-100 bg-slate-50 px-6 py-4 text-slate-600">
                  {profile?.user_email}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Phone className="h-4 w-4" />
                  Số điện thoại
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.user_phone}
                    onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-6 py-4 text-slate-900 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-200 outline-none"
                  />
                ) : (
                  <div className="rounded-2xl border border-sky-100 bg-slate-50 px-6 py-4">
                    {profile?.user_phone || "Chưa cập nhật"}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <ShieldCheck className="h-4 w-4" />
                  Vai trò
                </label>
                {editing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, user_role: "renter" })}
                      className={`rounded-2xl border px-6 py-5 font-semibold transition-all ${
                        formData.user_role === "renter"
                          ? "border-[#0EA5E9] bg-sky-50 text-[#0EA5E9]"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      🏠 Người thuê
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, user_role: "owner" })}
                      className={`rounded-2xl border px-6 py-5 font-semibold transition-all ${
                        formData.user_role === "owner"
                          ? "border-[#0EA5E9] bg-sky-50 text-[#0EA5E9]"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      🔑 Chủ trọ
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-sky-100 bg-slate-50 px-6 py-4">
                    {profile?.user_role === "owner" ? "🔑 Chủ trọ" : "🏠 Người thuê"}
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] py-4 font-bold text-white shadow-lg shadow-sky-400/40"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      user_name: profile?.user_name || "",
                      user_phone: profile?.user_phone || "",
                      user_role: profile?.user_role || "renter",
                    });
                  }}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white py-4 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}