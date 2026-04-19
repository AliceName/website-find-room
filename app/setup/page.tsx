"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SetupPage() {
  const [status, setStatus] = useState<"checking" | "creating" | "success" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAndCreateBucket();
  }, []);

  const checkAndCreateBucket = async () => {
    try {
      setStatus("checking");
      setMessage("🔍 Đang kiểm tra bucket...");

      // Liệt kê buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        setStatus("error");
        setMessage(`❌ Lỗi liệt kê buckets: ${listError.message}`);
        console.error("List buckets error:", listError);
        return;
      }

      console.log("📦 Buckets hiện tại:", buckets);

      const bucketExists = buckets?.some((b) => b.name === "room-images");

      if (bucketExists) {
        setStatus("success");
        setMessage("✅ Bucket 'room-images' đã tồn tại!");
        return;
      }

      // Tạo bucket
      setStatus("creating");
      setMessage("📁 Đang tạo bucket 'room-images'...");

      const { data, error: createError } = await supabase.storage.createBucket(
        "room-images",
        {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        }
      );

      if (createError) {
        setStatus("error");
        setMessage(`❌ Lỗi tạo bucket: ${createError.message}`);
        console.error("Create bucket error:", createError);
        return;
      }

      console.log("✅ Bucket created:", data);
      setStatus("success");
      setMessage("✅ Bucket 'room-images' được tạo thành công!");
    } catch (error: any) {
      setStatus("error");
      setMessage(`❌ Lỗi: ${error.message}`);
      console.error("Setup error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-gray-900">🚀 Setup</h1>
          <p className="text-gray-500">Khởi tạo Storage Bucket</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            {status === "checking" && (
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            )}
            {status === "creating" && (
              <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            )}
            {status === "success" && <span className="text-2xl">✅</span>}
            {status === "error" && <span className="text-2xl">❌</span>}

            <p className="font-bold text-gray-900">{message}</p>
          </div>

          {/* Debug Info */}
          <details className="text-xs text-gray-500 bg-white rounded-lg p-3 cursor-pointer">
            <summary className="font-bold hover:text-gray-700">Chi tiết debug</summary>
            <pre className="mt-2 text-[10px] overflow-auto max-h-48 p-2 bg-gray-100 rounded">
              {JSON.stringify(
                {
                  status,
                  message,
                  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={checkAndCreateBucket}
            disabled={status === "checking" || status === "creating"}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-2xl transition-all"
          >
            {status === "success" ? "✅ Hoàn tất" : "🔄 Thử lại"}
          </button>

          {status === "success" && (
            <a
              href="/post"
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl transition-all"
            >
              ➜ Đi tới Tạo bài viết
            </a>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-gray-700 space-y-2">
          <p className="font-bold text-blue-900">💡 Nếu lỗi:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Kiểm tra Supabase URL & API Key</li>
            <li>Đảm bảo user có permission tạo bucket</li>
            <li>Thử refresh page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
