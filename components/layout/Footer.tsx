import Link from "next/link";

export default function Footer() {
    return (
        <div className="bg-gray-900 text-gray-300 pt-10 pb-6">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
                <div>
                    <h2 className="text-xl font-bold text-white mb-3">FindRoom</h2>
                    <p className="text-sm">
                        Nền tảng tìm kiếm và đăng tin cho thuê phòng trọ, căn hộ uy tín.
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Liên kết</h3>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <a href="#" className="hover:text-white">
                                Trang chủ
                            </a>
                        </li>
                        <li>
                            <a href="#" className="hover:text-white">
                                Tìm phòng
                            </a>
                        </li>
                        <li>
                            <a href="#" className="hover:text-white">
                                Đăng tin
                            </a>
                        </li>
                        <li>
                            <a href="#" className="hover:text-white">
                                Liên hệ
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Liên hệ</h3>
                    <p className="text-sm">📍 TP.HCM</p>
                    <p className="text-sm">📞 0123 456 789</p>
                    <p className="text-sm">✉️ contact@findroom.vn</p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                        Nhận tin mới
                    </h3>
                    <form className="flex flex-col space-y-2">
                        <input
                            type="email"
                            placeholder="Nhập email..."
                            className="px-3 py-2 rounded bg-gray-800 text-sm focus:outline-none"
                        />
                        <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">
                            Đăng ký
                        </button>
                    </form>
                </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm">
                © 2026 FindRoom. All rights reserved.
            </div>
        </div>
    );
}
