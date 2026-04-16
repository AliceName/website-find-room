import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { notFound } from 'next/navigation'

// 1. Định nghĩa interface cho ảnh
interface RoomImage {
    image_id: string;
    image_url: string;
    is_360: boolean;
}

// 2. Định nghĩa interface cho phòng chi tiết (bao gồm mảng ảnh)
interface RoomDetail {
    room_id: string;
    room_description: string | null;
    room_price: number | null;
    room_area: number | null;
    room_status: boolean | null;
    vr_url: string | null;
    roomimages?: RoomImage[]; // Xác định rõ đây là mảng đối tượng RoomImage
    room_types?: { room_type_name: string };
}

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params

    // 3. Thực hiện truy vấn và ép kiểu dữ liệu trả về
    const { data, error } = await supabase
        .from('rooms')
        .select(`
      room_id,
      room_description,
      room_price,
      room_area,
      room_status,
      roomimages (
        image_id,
        image_url,
        is_360
      )
    `)
        .eq('room_id', id)
        .single();

    // Ép kiểu (Type Casting) dữ liệu sau khi lấy về
    const room = data as unknown as RoomDetail | null;

    if (error || !room) {
        return notFound(); // Tự động chuyển hướng đến trang 404 chuẩn
    }

    // 4. Phân loại ảnh với Type an toàn
    const images = room.roomimages || [];
    const vrImage = images.find((img) => img.is_360);
    const normalImages = images.filter((img) => !img.is_360);

    const vrUrl = room.vr_url || vrImage?.image_url || "https://360vr.vn/projects/HCM-drone-360vr/";

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            {/* 1. TIÊU ĐỀ & LOẠI PHÒNG */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
                        {room.room_types?.room_type_name || 'Phòng trọ'}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${room.room_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {room.room_status ? '● Đang trống' : '● Đã cho thuê'}
                    </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                    {room.room_description?.split(',')[0] || 'Thông tin chi tiết phòng trọ'}
                </h1>
            </div>

            {/* 2. TRÌNH XEM VR 360 */}
            <section className="relative group">
                <div className="w-full h-[400px] md:h-[550px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
                    <iframe src={vrUrl} className="w-full h-full border-none" allowFullScreen />
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Chế độ xem 360°
                </div>
            </section>

            {/* 3. THÔNG TIN CHI TIẾT & BẢNG GIÁ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Nội dung mô tả */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold mb-4">Mô tả chi tiết</h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {room.room_description || 'Chưa có mô tả chi tiết cho phòng này.'}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-50">
                            <div>
                                <p className="text-gray-400 text-sm">Diện tích</p>
                                <p className="font-bold">{room.room_area} m²</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Trạng thái</p>
                                <p className="font-bold text-green-600">Sẵn sàng</p>
                            </div>
                        </div>
                    </section>

                    {/* THƯ VIỆN ẢNH CHI TIẾT */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">Hình ảnh thực tế</h2>
                        {normalImages.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {normalImages.map((img) => (
                                    <div key={img.image_id} className="relative aspect-[4/3] rounded-xl overflow-hidden border group bg-gray-50">
                                        <Image
                                            src={img.image_url}
                                            alt="Ảnh phòng"
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">Đang cập nhật hình ảnh...</p>
                        )}
                    </section>
                </div>

                {/* Cột phải: Thẻ Giá & Liên hệ (Sticky) */}
                <aside className="lg:col-start-3">
                    <div className="sticky top-24 p-6 rounded-3xl bg-blue-700 text-white shadow-xl space-y-6">
                        <div>
                            <p className="text-blue-200 text-sm font-medium">Giá thuê hàng tháng</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">{room.room_price?.toLocaleString('vi-VN')}</span>
                                <span className="text-xl font-bold">VNĐ</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20">
                                Liên hệ chủ trọ
                            </button>
                            <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl border border-blue-500 hover:bg-blue-500 transition-colors">
                                Lưu tin này
                            </button>
                        </div>

                        <p className="text-xs text-blue-200 text-center">
                            Lưu ý: Liên hệ sớm để giữ chỗ vì phòng rất hot!
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    )
}