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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <span className="text-4xl font-black text-blue-600 tracking-tight">FindRoom</span>
                    </Link>
                    <p className="text-gray-500 text-sm mt-2 font-medium">
                        Tạo tài khoản để đăng tin hoặc tìm phòng trọ phù hợp.
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

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Email *
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
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0901 234 567"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Mật khẩu *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Tối thiểu 6 ký tự"
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

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
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
                                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                                role === r.value
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <p className="font-bold text-sm text-gray-800">{r.label}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{r.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-200 active:scale-95"
                            >
                                {loading ? "Đang tạo tài khoản..." : "TẠO TÀI KHOẢN"}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            Đã có tài khoản?{' '}
                            <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">
                                Đăng nhập
                            </Link>
                        </div>
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
