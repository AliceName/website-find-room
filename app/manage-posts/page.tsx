"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Post {
  post_id: string;
  post_title: string;
  room_id: string;
  user_id: string;
  post_created_at: string;
  post_updated_at?: string;
  post_expired_at?: string;
  rooms?: {
    room_status: boolean;
    location_id: string;
  };
}

export default function ManagePostsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        router.push("/auth/login");
      }
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchUserPosts();
  }, [user]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [success, error]);

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      // Schema: posts(post_id, room_id, post_title, user_id, post_created_at, post_updated_at, post_expired_at)
      // user_id là uuid từ auth
      const { data, error } = await supabase
        .from("posts")
        .select(`
          post_id,
          post_title,
          room_id,
          user_id,
          post_created_at,
          post_updated_at,
          post_expired_at,
          rooms!inner(room_status, location_id)
        `)
        .eq("user_id", user.id)
        .order("post_created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải bài đăng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      // 1. Lấy post để kiểm tra quyền và lấy room_id
      const { data: post, error: fetchErr } = await supabase
        .from("posts")
        .select("post_id, room_id, user_id")
        .eq("post_id", postId)
        .single();

      if (fetchErr || !post) {
        setError("Không tìm thấy bài đăng");
        return;
      }

      // 2. Kiểm tra quyền: user_id phải match
      if (post.user_id !== user.id) {
        setError("Bạn không có quyền xóa bài đăng này");
        return;
      }

      // 3. Xóa roomimages (ảnh phòng)
      if (post.room_id) {
        await supabase.from("roomimages").delete().eq("room_id", post.room_id);

        // 4. Xóa roomamenities (tiện ích)
        await supabase.from("roomamenities").delete().eq("room_id", post.room_id);

        // 5. Xóa room
        const { error: roomErr } = await supabase
          .from("rooms")
          .delete()
          .eq("room_id", post.room_id)
          .eq("owner_id", user.id);

        if (roomErr) throw new Error("Lỗi xóa phòng: " + roomErr.message);
      }

      // 6. Xóa post
      const { error: postErr } = await supabase
        .from("posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (postErr) throw new Error("Lỗi xóa bài đăng: " + postErr.message);

      setSuccess("Xóa bài đăng thành công!");
      setDeleteConfirm(null);
      fetchUserPosts();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa bài đăng");
    }
  };

  const handleEdit = (postId: string) => {
    router.push(`/post/edit/${postId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Quản lý bài đăng</h1>
          <p className="text-gray-600">Tạo, sửa và xóa các bài đăng của bạn</p>
        </div>

        {/* Alerts */}
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

        {/* New Post Button */}
        <Link
          href="/post"
          className="inline-flex items-center justify-center mb-8 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white hover:bg-blue-700 transition-all active:scale-95"
        >
          + Tạo bài đăng mới
        </Link>

        {/* Posts Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Đang tải bài đăng...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Bạn chưa có bài đăng nào</p>
            <Link
              href="/post"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700 transition-all"
            >
              Tạo bài đăng đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Tiêu đề</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Ngày tạo</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Cập nhật lần cuối</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-gray-600 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.post_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{post.post_title}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          post.rooms?.room_status
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {post.rooms?.room_status ? "Còn phòng" : "Hết phòng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(post.post_created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.post_updated_at
                        ? new Date(post.post_updated_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(post.post_id)}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-100 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-200 transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(post.post_id)}
                          className="inline-flex items-center justify-center rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-200 transition-all"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="mb-6">
              <span className="text-5xl">🗑️</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Xóa bài đăng?</h3>
            <p className="text-gray-600 text-sm mb-8">
              Bạn chắc chắn muốn xóa bài đăng này? Hành động này sẽ xóa toàn bộ dữ liệu liên quan (phòng, ảnh, tiện ích).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition-all"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
