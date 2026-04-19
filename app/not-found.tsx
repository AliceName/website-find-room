import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                <div className="text-8xl mb-6">🏚️</div>
                <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Không tìm thấy trang</h2>
                <p className="text-gray-500 mb-8">
                    Trang bạn đang tìm không tồn tại hoặc đã bị xóa.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-200"
                    >
                        🏠 Về trang chủ
                    </Link>
                    <Link
                        href="/rooms"
                        className="border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black hover:bg-gray-50 transition-all"
                    >
                        🔍 Tìm phòng
                    </Link>
                </div>
            </div>
        </div>
    );
}
