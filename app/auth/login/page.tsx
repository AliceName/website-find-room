"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    useEffect(() => {
        if (!success && !error) return;
        const timer = setTimeout(() => { setSuccess(null); setError(null); }, 5000);
        return () => clearTimeout(timer);
    }, [success, error]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                setError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
            } else if (error.message.includes("Email not confirmed")) {
                setError("Email chưa được xác nhận. Vui lòng kiểm tra hộp thư và xác nhận email.");
            } else {
                setError("Đăng nhập thất bại: " + error.message);
            }
            setLoading(false);
        } else {
            setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
            setLoading(false);
            setTimeout(() => {
                router.push("/");
                router.refresh();
            }, 1000);
        }
    };

    const handleForgotPassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Vui lòng nhập email của bạn.");
            return;
        }
        setForgotLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
            setError("Lỗi gửi email: " + error.message);
        } else {
            setSuccess("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
            setForgotMode(false);
        }
        setForgotLoading(false);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dbeafe_0%,#f8fafc_45%,#f8fafc_100%)] p-4 flex items-center justify-center text-slate-900">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-block">
                        <span className="text-4xl font-black tracking-tight text-blue-600">FindRoom</span>
                    </Link>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        {forgotMode ? "Đặt lại mật khẩu" : "Truy cập nhanh, tìm phòng rõ ràng hơn"}
                    </p>
                </div>

                <div className="overflow-hidden rounded-[2.5rem] border border-app bg-surface shadow-xl">
                    <div className="p-8 md:p-10">
                        <div className={`grid transition-[grid-template-rows] duration-[220ms] ease-[var(--ease-out-quart)] ${error ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                            <div className="min-h-0 overflow-hidden">
                                {error && (
                                    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50">
                                        <div className="flex items-start gap-3 p-4">
                                            <span className="mt-0.5 text-lg text-red-500">⚠️</span>
                                            <p className="text-sm font-medium text-red-600">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`grid transition-[grid-template-rows,opacity,transform] duration-[260ms] ease-[var(--ease-out-quart)] ${success ? "grid-rows-[1fr] opacity-100 translate-y-0 mb-6" : "grid-rows-[0fr] opacity-0 -translate-y-2 mb-0"}`}>
                            <div className="min-h-0 overflow-hidden">
                                {success && (
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50">
                                        <div className="flex items-start gap-3 p-4">
                                            <span className="mt-0.5 text-lg text-emerald-600">✅</span>
                                            <p className="text-sm font-medium text-emerald-700">{success}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {forgotMode ? (
                            <form onSubmit={handleForgotPassword} className="space-y-5">
                                <p className="mb-4 text-sm text-slate-600">
                                    Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
                                </p>
                                <div>
                                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        className="w-full rounded-2xl border border-app bg-surface px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.18),0_0_0_6px_rgba(37,99,235,0.10)]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full rounded-2xl bg-blue-600 py-4 font-black text-base text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    <span className="inline-flex items-center justify-center gap-2">
                                        {forgotLoading && (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        )}
                                        <span>{forgotLoading ? "Đang gửi..." : "GỬI EMAIL ĐẶT LẠI"}</span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForgotMode(false)}
                                    className="w-full text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                                >
                                    ← Quay lại đăng nhập
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        className="w-full rounded-2xl border border-app bg-surface px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.18),0_0_0_6px_rgba(37,99,235,0.10)]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-2xl border border-app bg-surface px-4 py-3.5 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.18),0_0_0_6px_rgba(37,99,235,0.10)]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition-colors hover:text-slate-600"
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <button
                                        type="button"
                                        onClick={() => setForgotMode(true)}
                                        className="font-bold text-blue-600 transition-colors hover:text-blue-700"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                    <Link href="/auth/register" className="font-bold text-blue-600 transition-colors hover:text-blue-700">
                                        Đăng ký ngay
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-2xl bg-blue-600 py-4 font-black text-base text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    <span className="inline-flex items-center justify-center gap-2">
                                        {loading && (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        )}
                                        <span>{loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}</span>
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
                        ← Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
