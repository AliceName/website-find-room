import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/types/supabase'
import PostCard from '@/components/rooms/PostCard'
import Link from 'next/link'

// Định nghĩa kiểu dữ liệu mở rộng cho kết quả truy vấn Join
type PostWithDetails = Database['public']['Tables']['posts']['Row'] & {
  rooms: (Database['public']['Tables']['rooms']['Row'] & {
    room_types?: Database['public']['Tables']['roomtypes']['Row'];
    roomimages?: Database['public']['Tables']['roomimages']['Row'][];
  }) | null;
};

export default async function HomePage() {
  // 1. Truy vấn dữ liệu từ bảng Post và Join các bảng liên quan
  // Ta dùng cú pháp của Supabase để lấy các bảng con
  const { data, error } = await supabase
    .from('posts')
    .select(`
      post_id,
      post_title,
      post_created_at,
      rooms:room_id (
        room_id,
        room_price,
        room_area,
        room_status,
        room_types:room_type_id (
          room_type_name
        ),
        roomimages (
          image_url,
          is_360
        )
      )
    `)
    .order('post_created_at', { ascending: false });

  // 2. Ép kiểu dữ liệu để sử dụng trong Component
  const posts = data as unknown as PostWithDetails[] | null;

  // 3. Xử lý lỗi nếu có
  if (error) {
    console.error('Lỗi lấy dữ liệu:', error);
    return (
      <div className="max-w-7xl mx-auto p-10 text-center">
        <p className="text-red-500 font-bold">Đã xảy ra lỗi khi tải danh sách bài đăng.</p>
      </div>
    );
  }

  // 4. Xử lý nếu không có bài đăng
  if (!posts || posts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-10 text-center">
        <p className="text-gray-500 font-medium">Hiện tại chưa có bài đăng nào.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      {/* SECTION 2: DANH SÁCH BÀI ĐĂNG */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none antialiased">🔥 Tin mới cập nhật</h2>
            <p className="text-gray-500 font-medium">Khám phá những căn phòng tốt nhất vừa được đăng tải</p>
          </div>
          <Link href="/rooms" className="text-blue-600 font-bold hover:underline hidden md:block">
            Xem tất cả bài đăng →
          </Link>
        </div>

        {/* Lưới hiển thị PostCard */}
        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {posts?.map((post) => (
              <Link key={post.post_id} href={`/rooms/${post.post_id}`}> {/* DÙNG post_id Ở ĐÂY */}
                <PostCard post={post} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Hiện tại chưa có bài đăng nào.</p>
          </div>
        )}
      </section>

      {/* SECTION 3: ĐỊA ĐIỂM PHỔ BIẾN (Dành cho SEO) */}
      <section className="bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white">
        <h2 className="text-2xl font-bold mb-6">Khu vực quanh HUTECH</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Quận 9', 'Thủ Đức', 'Quận Bình Thạnh', 'Khu Công Nghệ Cao'].map((loc) => (
            <div key={loc} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/10 transition-colors cursor-pointer">
              <p className="font-bold">{loc}</p>
              <p className="text-xs text-gray-400 uppercase mt-1 tracking-widest">Xem 20+ phòng</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}