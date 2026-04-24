"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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
        const timer = setTimeout(() => { setSuccess(null); setError(null); }, 5000);
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

        // 1. Đăng ký tài khoản Supabase Auth
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
                setError(authError.message || "Đăng ký thất bại. Vui lòng thử lại.");
            }
            setLoading(false);
            return;
        }

        // 2. Nếu có user_id (không cần xác minh email), insert vào bảng users
        if (data.user) {
            const { error: userInsertError } = await supabase
                .from("users")
                .upsert({
                    user_id: data.user.id,
                    user_name: fullName,
                    user_email: email,
                    user_phone: phone || null,
                    user_role: role,
                }, { onConflict: 'user_id' });

            if (userInsertError) {
                console.warn("Lỗi tạo profile:", userInsertError.message);
                // Không block đăng ký - có thể đã có trigger
            }
        }

        setSuccess("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.");
        setEmail("");
        setPassword("");
        setFullName("");
        setPhone("");
        setRole("renter");

        // Nếu không cần xác minh email (dev mode), redirect
        if (data.session) {
            setTimeout(() => router.push("/"), 1000);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dbeafe_0%,#f8fafc_45%,#f8fafc_100%)] p-4 flex items-center justify-center text-slate-900">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-block">
                        <span className="text-4xl font-black tracking-tight text-blue-600">FindRoom</span>
                    </Link>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        Tạo tài khoản để tìm phòng hoặc đăng tin cho thuê.
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

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full rounded-2xl border border-app bg-surface px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.18),0_0_0_6px_rgba(37,99,235,0.10)]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                                    Email *
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
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0901 234 567"
                                    className="w-full rounded-2xl border border-app bg-surface px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.18),0_0_0_6px_rgba(37,99,235,0.10)]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                                    Mật khẩu *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Tối thiểu 6 ký tự"
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

                            <div>
                                <label className="mb-3 block text-xs font-black uppercase tracking-widest text-slate-500">
                                    Bạn là
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { value: "renter", label: "🏠 Người thuê", desc: "Tìm phòng trọ" },
                                        { value: "owner", label: "🔑 Chủ trọ", desc: "Đăng tin cho thuê" },
                                    ] as const).map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setRole(r.value)}
                                            className={`rounded-2xl border-2 p-4 text-left transition-all duration-[180ms] ease-[var(--ease-out-quart)] ${
                                                role === r.value
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <p className="text-sm font-bold text-slate-800">{r.label}</p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">{r.desc}</p>
                                        </button>
                                    ))}
                                </div>
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
                                    <span>{loading ? "Đang tạo tài khoản..." : "TẠO TÀI KHOẢN"}</span>
                                </span>
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            Đã có tài khoản?{' '}
                            <Link href="/auth/login" className="font-bold text-blue-600 transition-colors hover:text-blue-700">
                                Đăng nhập
                            </Link>
                        </div>
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
