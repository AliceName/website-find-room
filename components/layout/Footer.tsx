import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-app bg-white text-slate-700">
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
                <div>
                    <h2 className="mb-3 text-xl font-black text-slate-950">FindRoom</h2>
                    <p className="text-sm leading-6 text-slate-500">
                        Nền tảng tìm kiếm và đăng tin cho thuê phòng trọ, căn hộ uy tín.
                    </p>
                </div>

                <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-950">Liên kết</h3>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link href="/" className="transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:text-blue-600 hover:translate-x-0.5">
                                Trang chủ
                            </Link>
                        </li>
                        <li>
                            <Link href="/rooms" className="transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:text-blue-600 hover:translate-x-0.5">
                                Tìm phòng
                            </Link>
                        </li>
                        <li>
                            <Link href="/post" className="transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:text-blue-600 hover:translate-x-0.5">
                                Đăng tin
                            </Link>
                        </li>
                        <li>
                            <a href="mailto:contact@findroom.vn" className="transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:text-blue-600 hover:translate-x-0.5">
                                Liên hệ
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-950">Liên hệ</h3>
                    <p className="text-sm text-slate-500">📍 TP.HCM</p>
                    <p className="text-sm text-slate-500">📞 0123 456 789</p>
                    <p className="text-sm text-slate-500">✉️ contact@findroom.vn</p>
                </div>

                <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-950">
                        Nhận tin mới
                    </h3>
                    <form className="space-y-2">
                        <input
                            type="email"
                            placeholder="Nhập email..."
                            className="w-full rounded-2xl border border-app bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white"
                        />
                        <button className="w-full rounded-2xl bg-blue-600 py-2 text-sm font-bold text-white transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.98]">
                            Đăng ký
                        </button>
                    </form>
                </div>
            </div>

            <div className="border-t border-app py-4 text-center text-sm text-slate-500">
                © 2026 FindRoom. All rights reserved.
            </div>
        </footer>
    );
}
