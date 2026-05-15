"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Sparkles, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [forgotMode, setForgotMode] = useState(false);

    useEffect(() => {
        if (!success && !error) return;
        const timer = setTimeout(() => {
            setSuccess(null);
            setError(null);
        }, 5000);
        return () => clearTimeout(timer);
    }, [success, error]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                setError("Email hoặc mật khẩu không chính xác.");
            } else if (error.message.includes("Email not confirmed")) {
                setError("Email chưa được xác nhận.");
            } else {
                setError(error.message);
            }
            setLoading(false);
            return;
        }

        const currentUser = signInData.user;
        if (currentUser) {
            const { data: profile } = await supabase
                .from("users")
                .select("is_banned, ban_reason")
                .eq("user_id", currentUser.id)
                .single();

            if (profile?.is_banned) {
                await supabase.auth.signOut({ scope: "local" });
                setError(profile.ban_reason || "Tài khoản đã bị khóa.");
                setLoading(false);
                return;
            }
        }

        setSuccess("Đăng nhập thành công!");
        setLoading(false);
        setTimeout(() => {
            router.push("/");
            router.refresh();
        }, 1200);
    };

    const handleForgotPassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Vui lòng nhập email.");
            return;
        }
        setForgotLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess("Đã gửi email đặt lại mật khẩu.");
            setForgotMode(false);
        }
        setForgotLoading(false);
    };

    return (
        <div className="flex min-h-screen bg-[#F0F9FF] text-slate-800 antialiased">

            {/* LEFT PANEL - Decorative */}
            <div className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col overflow-hidden border-r border-sky-100">

                <div 
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                        opacity: 0.6,
                    }}
                />

                <div className="relative z-10 flex flex-1 flex-col items-center justify-between p-12 xl:p-16">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] shadow-lg shadow-sky-300">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900">FindRoom</span>
                    </div>

                    {/* Main Title */}
                    <div className="text-center">
                        <h1 className="text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight text-slate-900">
                            Tìm phòng<br />
                            <span className="bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] bg-clip-text text-transparent">
                                nhanh chóng
                            </span><br />
                            tiện lợi
                        </h1>

                        <p className="mx-auto mt-6 max-w-md text-lg text-slate-600">
                            Đăng nhập để tiếp tục tìm kiếm phòng trọ phù hợp nhất với bạn.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-10">
                        {[
                            { value: "12K+", label: "Phòng trọ" },
                            { value: "98%", label: "Hài lòng" },
                            { value: "50+", label: "Tỉnh thành" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-3xl font-black text-[#0EA5E9]">{stat.value}</p>
                                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Login Form */}
            <div className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10">

                <div className="relative z-10 w-full max-w-[380px]">

                    {/* Mobile Logo */}
                    <div className="mb-10 flex items-center gap-3 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC]">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight">FindRoom</span>
                    </div>

                    <motion.div
                        key={forgotMode ? "forgot" : "login"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-3xl font-black text-slate-900">
                            {forgotMode ? "Quên mật khẩu?" : "Đăng nhập"}
                        </h2>
                        <p className="mt-2 text-slate-600">
                            {forgotMode
                                ? "Nhập email để nhận liên kết đặt lại mật khẩu."
                                : "Chào mừng bạn quay trở lại 👋"}
                        </p>
                    </motion.div>

                    {/* Error & Success Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                            >
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@email.com"
                                    className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-4 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {!forgotMode && (
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-600">Mật khẩu</label>
                                    <button
                                        type="button"
                                        onClick={() => setForgotMode(true)}
                                        className="text-sm text-[#0EA5E9] hover:underline"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-12 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none transition-all"
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
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || forgotLoading}
                            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] text-base font-bold text-white shadow-lg shadow-sky-300 transition-all disabled:opacity-70"
                        >
                            {loading || forgotLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : forgotMode ? (
                                "Gửi liên kết đặt lại"
                            ) : (
                                "Đăng nhập"
                            )}
                        </motion.button>

                        {forgotMode && (
                            <button
                                type="button"
                                onClick={() => setForgotMode(false)}
                                className="flex w-full items-center justify-center gap-2 py-2 text-slate-600 hover:text-slate-900"
                            >
                                <ArrowLeft size={16} /> Quay lại đăng nhập
                            </button>
                        )}
                    </form>

                    {!forgotMode && (
                        <p className="mt-8 text-center text-slate-600">
                            Chưa có tài khoản?{" "}
                            <Link href="/auth/register" className="font-semibold text-[#0EA5E9] hover:underline">
                                Đăng ký miễn phí
                            </Link>
                        </p>
                    )}

                    <div className="mt-8 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft size={14} /> Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}