import Link from "next/link";
// import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // [cite: 65]
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  return (
    <div className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="text-xl font-bold text-blue-600">
          FindRoom
        </div>
        <ul className="hidden md:flex space-x-6 text-gray-700 font-medium">
          <li><a href="#" className="hover:text-blue-500">Trang chủ</a></li>
          <li><a href="#" className="hover:text-blue-500">Tìm phòng</a></li>
          <li><a href="#" className="hover:text-blue-500">Đăng tin</a></li>
          <li><a href="#" className="hover:text-blue-500">Liên hệ</a></li>
        </ul>

        <div className="hidden md:block">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Đăng nhập
          </button>
        </div>

        <button id="menu-btn" className="md:hidden text-gray-700">
          ☰
        </button>
      </div>

      <div id="menu" className="hidden md:hidden px-6 pb-4">
        <ul className="space-y-3 text-gray-700">
          <li><a href="#">Trang chủ</a></li>
          <li><a href="#">Tìm phòng</a></li>
          <li><a href="#">Đăng tin</a></li>
          <li><a href="#">Liên hệ</a></li>
          <li>
            <button className="w-full bg-blue-500 text-white py-2 rounded">
              Đăng nhập
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
