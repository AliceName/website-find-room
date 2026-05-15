"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Mail,
    Lock,
    Phone,
    User,
    Home,
    KeyRound,
    Sparkles,
} from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<"renter" | "owner">("renter");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!success && !error) return;
        const timer = setTimeout(() => {
            setSuccess(null);
            setError(null);
        }, 5000);
        return () => clearTimeout(timer);
    }, [success, error]);

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự.");
            setLoading(false);
            return;
        }

        if (!fullName.trim()) {
            setError("Vui lòng nhập họ và tên.");
            setLoading(false);
            return;
        }

        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone,
                    role,
                },
            },
        });

        if (authError) {
            if (authError.message.includes("already registered")) {
                setError("Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.");
            } else {
                setError(authError.message || "Đăng ký thất bại.");
            }
            setLoading(false);
            return;
        }

        if (data.user) {
            await supabase.from("users").upsert(
                {
                    user_id: data.user.id,
                    user_name: fullName,
                    user_email: email,
                    user_phone: phone || null,
                    user_role: role,
                },
                { onConflict: "user_id" }
            );
        }

        setSuccess("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.");

        // Reset form
        setEmail("");
        setPassword("");
        setFullName("");
        setPhone("");
        setRole("renter");

        setLoading(false);
    };

    return (
        <div className="relative min-h-screen bg-[#F0F9FF] text-slate-800 overflow-hidden">
            {/* Background Pattern + Glows */}
            <div className="fixed inset-0 -z-10">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                <div className="absolute left-[-180px] top-[-120px] h-[520px] w-[520px] rounded-full bg-[#7DD3FC]/50 blur-[120px]" />
                <div className="absolute bottom-[-180px] right-[-160px] h-[480px] w-[480px] rounded-full bg-[#0EA5E9]/30 blur-[130px]" />
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] shadow-lg shadow-sky-300">
                                <Sparkles className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">FindRoom</h1>
                                <p className="text-xs tracking-widest text-slate-500">PREMIUM RENTAL</p>
                            </div>
                        </Link>
                    </div>

                    {/* Card */}
                    <div className="rounded-[32px] border border-sky-100 bg-white p-8 shadow-2xl md:p-10">
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#0EA5E9]">JOIN US</p>
                            <h2 className="mt-2 text-3xl font-black text-slate-900">Tạo tài khoản mới</h2>
                            <p className="mt-2 text-slate-600">Bắt đầu hành trình tìm phòng lý tưởng của bạn</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">Họ và tên</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-4 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-4 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">Số điện thoại</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0901 234 567"
                                        className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-4 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Tối thiểu 6 ký tự"
                                        className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-12 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="mb-3 block text-sm font-medium text-slate-600">Bạn là</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: "renter", label: "Người thuê", icon: Home, desc: "Tìm phòng" },
                                        { value: "owner", label: "Chủ trọ", icon: KeyRound, desc: "Đăng tin" },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        const isSelected = role === item.value;

                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => setRole(item.value as "renter" | "owner")}
                                                className={`rounded-2xl border p-4 text-left transition-all ${
                                                    isSelected
                                                        ? "border-[#0EA5E9] bg-sky-50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`rounded-xl p-2.5 ${isSelected ? "bg-sky-100 text-[#0EA5E9]" : "bg-slate-100 text-slate-500"}`}>
                                                        <Icon size={22} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{item.label}</p>
                                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] py-4 text-base font-bold text-white shadow-lg shadow-sky-300 transition-all disabled:opacity-70"
                            >
                                {loading ? "Đang tạo tài khoản..." : "TẠO TÀI KHOẢN"}
                            </motion.button>
                        </form>

                        <p className="mt-6 text-center text-slate-600">
                            Đã có tài khoản?{" "}
                            <Link href="/auth/login" className="font-semibold text-[#0EA5E9] hover:underline">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft size={14} /> Về trang chủ
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}