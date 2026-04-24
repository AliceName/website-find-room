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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <span className="text-4xl font-black text-blue-600 tracking-tight">FindRoom</span>
                    </Link>
                    <p className="text-gray-500 text-sm mt-2 font-medium">
                        {forgotMode ? "Đặt lại mật khẩu" : "Tìm phòng trọ ưng ý, nhanh chóng & minh bạch"}
                    </p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-10">
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

                        {forgotMode ? (
                            <form onSubmit={handleForgotPassword} className="space-y-5">
                                <p className="text-gray-600 text-sm mb-4">
                                    Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
                                </p>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-200"
                                >
                                    {forgotLoading ? "Đang gửi..." : "GỬI EMAIL ĐẶT LẠI"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForgotMode(false)}
                                    className="w-full text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
                                >
                                    ← Quay lại đăng nhập
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 pr-12 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <button
                                        type="button"
                                        onClick={() => setForgotMode(true)}
                                        className="font-bold text-blue-600 hover:underline"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                    <Link href="/auth/register" className="font-bold text-blue-600 hover:underline">
                                        Đăng ký ngay
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-200 active:scale-95"
                                >
                                    {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        ← Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
