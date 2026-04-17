"use client"
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [showFilter, setShowFilter] = useState(false); // Điều khiển hiện/ẩn bộ lọc
  const [showMap, setShowMap] = useState(false); // State để mở bản đồ
  return (
    <nav className="bg-white shadow-md sticky top-0 z-[50]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex justify-between items-center gap-4">
          {/* LOGO */}
          <Link href="/" className="text-2xl font-black text-blue-600 shrink-0">
            FindRoom
          </Link>

          {/* SEARCH BAR */}
          <div className="flex-grow max-w-xl relative">
            <input
              type="text"
              placeholder="Tìm khu vực, tên đường..."
              className="w-full bg-gray-100 border-none rounded-2xl py-2.5 pl-11 pr-20 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {/* Nút Tìm kiếm (Click vào đây để hiện bộ lọc) */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
            >
              Bộ lọc
            </button>
          </div>

          {/* MENU DESKTOP */}
          <ul className="hidden lg:flex space-x-6 text-gray-600 font-bold text-sm uppercase">
            <li><Link href="/">Trang chủ</Link></li>
            <li><Link href="/post">Đăng tin</Link></li>
            <li><Link href="/login">Đăng nhập</Link></li>
          </ul>
        </div>

        {/* --------------------------------------------------------- */}
        {/* BỘ LỌC HIỆN RA SAU KHI ẤN (ACCORDION) */}
        {/* --------------------------------------------------------- */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showFilter ? 'max-h-[400px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">

            {/* Khoảng giá */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-900 uppercase">Khoảng giá</label>
              <select className="w-full p-2.5 rounded-xl border-none text-sm bg-white shadow-sm outline-none">
                <option>Tất cả giá</option>
                <option>Dưới 2 triệu</option>
                <option>2 - 5 triệu</option>
                <option>Trên 5 triệu</option>
              </select>
            </div>

            {/* Loại phòng */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-900 uppercase">Loại phòng</label>
              <select className="w-full p-2.5 rounded-xl border-none text-sm bg-white shadow-sm outline-none">
                <option>Tất cả loại</option>
                <option>Phòng trọ</option>
                <option>Căn hộ mini</option>
                <option>Ký túc xá</option>
              </select>
            </div>

            {/* Diện tích */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-900 uppercase">Diện tích</label>
              <select className="w-full p-2.5 rounded-xl border-none text-sm bg-white shadow-sm outline-none">
                <option>Tất cả diện tích</option>
                <option>Dưới 20m²</option>
                <option>20 - 40m²</option>
                <option>Trên 40m²</option>
              </select>
            </div>

            {/* Nút Áp dụng */}
            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-black text-sm hover:shadow-lg hover:shadow-blue-200 transition-all">
                ÁP DỤNG
              </button>
            </div>

            {/* NÚT CHỌN TRÊN BẢN ĐỒ - THIẾT KẾ NỔI BẬT */}
            <div className="col-span-2 md:col-span-4 border-t border-blue-100 pt-4">
              <button
                onClick={() => setShowMap(true)}
                className="w-full bg-white hover:bg-gray-50 text-blue-600 border-2 border-dashed border-blue-300 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <span className="text-xl">📍</span>
                CHỌN VỊ TRÍ TRÊN BẢN ĐỒ TRỰC QUAN
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* --------------------------------------------------------- */}
      {/* MODAL BẢN ĐỒ (LIGHTBOX) */}
      {/* --------------------------------------------------------- */}
      {showMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 md:p-10 animate-in fade-in">
          <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[3rem] overflow-hidden relative shadow-2xl border-8 border-white">

            {/* Header của Map Modal */}
            <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4">
              <span className="text-blue-600 font-black">FindRoom Map</span>
              <p className="text-xs text-gray-500 font-bold">Di chuyển ghim để tìm phòng quanh HUTECH</p>
            </div>

            {/* Nút Đóng */}
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-6 right-6 z-10 bg-white w-12 h-12 rounded-full shadow-xl font-bold hover:rotate-90 transition-transform"
            >
              ✕
            </button>

            {/* KHU VỰC NHÚNG MAP (Iframe hoặc Leaflet Component) */}
            <div className="w-full h-full bg-gray-200">
              {/* Tạm thời dùng Google Maps Iframe để Nga test giao diện */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5201952559787!2d106.7019!3d10.7711!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a76d4531%3A0x759a36a0c8a23912!2zSFVURUNIIC0gxJDhuqFpIGjhu41jIEPDtG5nIG5naOG7hyBUUC5IQ00!5e0!3m2!1svi!2s!4v1713400000000!5m2!1svi!2s"
                className="w-full h-full border-none"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>

            {/* Footer nút xác nhận */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
              <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform active:scale-95">
                XÁC NHẬN VỊ TRÍ NÀY
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}