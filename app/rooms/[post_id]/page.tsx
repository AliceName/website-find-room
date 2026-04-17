import RoomGallery from '@/components/rooms/RoomGallery'
import { supabase } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Database } from '@/types/supabase'
import '@/app/globals.css'

type PostDetail = Database['public']['Tables']['posts']['Row'] & {
    rooms: (Database['public']['Tables']['rooms']['Row'] & {
        room_types: { room_type_name: string } | null;
        roomimages: { image_url: string; is_360: boolean }[];
    }) | null;
};

export default async function RoomDetailPage({ params }: { params: Promise<{ post_id: string }> }) {
    const { post_id } = await params;

    // Truy vấn theo post_id duy nhất
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      rooms:room_id (
        *,
        room_types:room_type_id ( room_type_name ),
        roomimages ( image_url, is_360 )
      )
    `)
        .eq('post_id', post_id)
        .single();

    if (error || !data) return notFound();

    const post = data as unknown as PostDetail;
    const room = post.rooms;
    const normalImages = room?.roomimages.filter(img => !img.is_360) || [];
    const vrImage = room?.roomimages.find(img => img.is_360);
    const finalVrUrl = room?.vr_url || vrImage?.image_url || "https://360vr.vn/projects/HCM-drone-360vr/";

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-700">
            {/* 1. HEADER: Tiêu đề & Thông số nhanh */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-normal leading-tight antialiased font-sanf">
                        {post.post_title}
                    </h1>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Giá thuê</span>
                            <span className="text-3xl font-black text-blue-600">
                                {room?.room_price?.toLocaleString()} <span className="text-base font-bold">đ/tháng</span>
                            </span>
                        </div>
                        <div className="h-10 w-[2px] bg-gray-100 hidden md:block"></div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Diện tích</span>
                            <span className="text-xl font-bold text-gray-700">📏 {room?.room_area} m²</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="px-6 py-3 rounded-2xl border-2 border-gray-100 font-bold hover:bg-gray-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                        ❤️ Lưu tin
                    </button>
                </div>
            </header>

            {/* 2. MAIN CONTENT: Chia 2 cột (Cột VR và Cột Liên hệ) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* CỘT TRÁI (8/12): VR & Hình ảnh & Mô tả */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Khung VR */}
                    <div className="relative rounded-[3rem] overflow-hidden bg-gray-900 border-8 border-white shadow-2xl h-[500px] md:h-[650px]">
                        <div className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Virtual Tour 360°</span>
                        </div>
                        <iframe src={finalVrUrl} className="w-full h-full border-none" allowFullScreen />
                    </div>

                    {/* Grid ảnh phụ bên dưới VR */}
                    <RoomGallery images={normalImages} />
                    {/* Mô tả chi tiết */}
                    <section className="bg-gray-50/50 p-8 md:p-12 rounded-[3rem] border border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                            Mô tả căn phòng
                        </h2>
                        <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                            {room?.room_description}
                        </p>
                    </section>
                </div>

                {/* CỘT PHẢI (4/12): Sidebar Liên hệ (Sticky) */}
                <aside className="lg:col-span-4">
                    <div className="sticky top-10 space-y-6">
                        <div className="bg-gray-900 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl border-t-8 border-blue-600">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                                    👤
                                </div>
                                <div>
                                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Hỗ trợ sinh viên</p>
                                    <h4 className="font-bold text-xl">Chủ sở hữu tin đăng</h4>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-4">
                                    <span>📞</span> GỌI CHỦ TRỌ
                                </button>
                                <button className="w-full bg-white/10 hover:bg-white/20 py-6 rounded-2xl font-black text-xl transition-all border border-white/10 flex items-center justify-center gap-4">
                                    <span>💬</span> CHAT ZALO
                                </button>
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10 text-center">
                                <p className="text-gray-400 text-[10px] font-medium tracking-tighter uppercase">
                                    Tin đăng đã được HUTECH Room Finder xác thực
                                </p>
                            </div>
                        </div>

                        {/* Card tiện ích nhỏ */}
                        <div className="bg-blue-50 rounded-[2.5rem] p-8 border border-blue-100">
                            <h5 className="font-black text-blue-900 mb-4 uppercase text-xs tracking-widest text-center">Tiện ích đi kèm</h5>
                            <div className="flex flex-wrap justify-center gap-2">
                                {['Máy lạnh', 'Wifi', 'Giờ tự do', 'An ninh'].map(item => (
                                    <span key={item} className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 shadow-sm">
                                        ✓ {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}