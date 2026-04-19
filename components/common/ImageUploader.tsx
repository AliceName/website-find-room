"use client";

import { useState, useRef } from "react";
import {
  uploadRoomImage,
  getRoomImages,
  deleteRoomImage,
  updateImage360Status,
} from "@/lib/services/storage.service";

interface RoomImage {
  image_id: string;
  room_id: string;
  image_url: string;
  is_360: boolean;
}

interface ImageUploaderProps {
  roomId: string;
  onUploadSuccess?: (images: RoomImage[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({
  roomId,
  onUploadSuccess,
  maxFiles = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<RoomImage[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [upload360Mode, setUpload360Mode] = useState(false);

  // Load images when component mounts
  const loadImages = async () => {
    setLoading(true);
    const result = await getRoomImages(roomId);
    if (result.error) {
      setError(result.error);
    } else {
      setImages(result.data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const totalImages = images.length + files.length;
    if (totalImages > maxFiles) {
      setError(`Tối đa ${maxFiles} ảnh. Bạn hiện có ${images.length} ảnh.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const newImages: RoomImage[] = [];

      for (const file of files) {
        // Upload with is360 flag based on mode
        const result = await uploadRoomImage(file, roomId, upload360Mode);

        if (result.error) {
          setError(result.error);
          continue;
        }

        if (result.imageData) {
          newImages.push(result.imageData);
          // Add preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews((prev) => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        }
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
        setSuccess(`Đã upload ${newImages.length} ảnh ${upload360Mode ? "360°" : "thường"} thành công`);
        onUploadSuccess?.([...images, ...newImages]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const confirmDelete = confirm("Bạn chắc chắn muốn xóa ảnh này?");
    if (!confirmDelete) return;

    const result = await deleteRoomImage(imageId, roomId);

    if (result.error) {
      setError(result.error);
    } else {
      setImages((prev) => prev.filter((img) => img.image_id !== imageId));
      setSuccess("Đã xóa ảnh thành công");
    }
  };

  const handleToggle360 = async (imageId: string, is360: boolean) => {
    const result = await updateImage360Status(imageId, !is360);

    if (result.error) {
      setError(result.error);
    } else {
      setImages((prev) =>
        prev.map((img) =>
          img.image_id === imageId ? { ...img, is_360: !is360 } : img
        )
      );
      setSuccess(`Đã cập nhật trạng thái 360 độ`);
    }
  };

  const normalImages = images.filter(img => !img.is_360);
  const image360s = images.filter(img => img.is_360);
  const normalPreviews = previews.slice(0, normalImages.length);
  const preview360s = previews.slice(normalImages.length);

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setUpload360Mode(false)}
          className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            !upload360Mode
              ? "bg-white text-blue-600 shadow-md"
              : "text-gray-600 hover:text-gray-700"
          }`}
        >
          📸 Ảnh thường ({normalImages.length})
        </button>
        <button
          onClick={() => setUpload360Mode(true)}
          className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            upload360Mode
              ? "bg-white text-blue-600 shadow-md"
              : "text-gray-600 hover:text-gray-700"
          }`}
        >
          🌐 Ảnh 360° ({image360s.length})
        </button>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          upload360Mode
            ? "border-purple-300 hover:bg-purple-50"
            : "border-blue-300 hover:bg-blue-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-3xl">{upload360Mode ? "🌐" : "📸"}</div>
          <div className="text-sm font-medium text-gray-700">
            {uploading
              ? "Đang upload..."
              : `Kéo thả hoặc click để chọn ảnh ${upload360Mode ? "360°" : "thường"}`}
          </div>
          <div className="text-xs text-gray-500">
            Tối đa {maxFiles} ảnh ({images.length} đã tải)
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-2">
          <div>{error}</div>
          {error.includes("setup") && (
            <a
              href="/setup"
              className="inline-block text-blue-600 hover:text-blue-800 font-bold underline"
            >
              → Vào trang setup để khởi tạo
            </a>
          )}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Images Grid - Regular */}
      {!upload360Mode && (normalImages.length > 0 || normalPreviews.length > 0) && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
            Ảnh thường ({normalImages.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {normalImages.map((image) => (
              <div
                key={image.image_id}
                className="relative group rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={image.image_url}
                  alt="Room"
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  <button
                    onClick={() => handleToggle360(image.image_id, image.is_360)}
                    title="Chuyển thành 360°"
                    className="bg-purple-500 hover:bg-purple-600 text-white p-1.5 rounded"
                  >
                    🌐
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image.image_id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {normalPreviews.map((preview, idx) => (
              <div
                key={`preview-${idx}`}
                className="relative rounded-lg overflow-hidden bg-gray-100 animate-pulse"
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-24 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Grid - 360 */}
      {upload360Mode && (image360s.length > 0 || preview360s.length > 0) && (
        <div>
          <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">
            Ảnh 360° ({image360s.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {image360s.map((image) => (
              <div
                key={image.image_id}
                className="relative group rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={image.image_url}
                  alt="360 Room"
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  <button
                    onClick={() => handleToggle360(image.image_id, image.is_360)}
                    title="Chuyển thành ảnh thường"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded"
                  >
                    📸
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image.image_id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded"
                  >
                    🗑️
                  </button>
                </div>
                <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold">
                  360°
                </div>
              </div>
            ))}
            {preview360s.map((preview, idx) => (
              <div
                key={`preview-360-${idx}`}
                className="relative rounded-lg overflow-hidden bg-gray-100 animate-pulse"
              >
                <img
                  src={preview}
                  alt="Preview 360"
                  className="w-full h-24 object-cover"
                />
                <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold">
                  360°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Both view when no uploads yet */}
      {images.length === 0 && !uploading && (
        <button
          onClick={loadImages}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
        >
          Tải ảnh từ thư viện
        </button>
      )}
    </div>
  );
}
