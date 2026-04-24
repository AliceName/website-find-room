# 🏠 FindRoom - Nền Tảng Tìm Kiếm & Đặt Phòng Trọ Thông Minh

FindRoom là một ứng dụng web hiện đại được xây dựng để kết nối chủ trọ và người thuê phòng. Dự án tập trung vào trải nghiệm người dùng với bản đồ tương tác trực quan và công nghệ xem phòng thực tế ảo (VR 360°).

---

## ✨ Tính Năng Nổi Bật

### 🔍 Tìm kiếm & Lọc thông minh
* **Tìm kiếm kép:** Nhận diện thông minh giữa từ khóa mô tả (máy lạnh, giá rẻ...) và địa danh địa lý (Quận 9, Thủ Đức...).
* **Lọc đa năng:** Lọc theo khoảng giá, diện tích, loại phòng và các tiện ích đi kèm.

### 📍 Bản đồ tương tác (Interactive Map)
* **Marker Clustering:** Nhóm các bài đăng ở cùng vị trí để giao diện gọn gàng.
* **Bán kính 20km:** Khi tìm theo địa điểm, bản đồ tự động khoanh vùng các kết quả trong bán kính 20km.
* **Auto-fitBounds:** Bản đồ tự động co giãn mức zoom để hiển thị vừa vặn tất cả các kết quả tìm kiếm.

### 🖼️ Trải nghiệm VR 360°
* Tích hợp trình xem ảnh toàn cảnh (Panorama), cho phép người thuê xem chi tiết không gian phòng từ xa một cách chân thực nhất.

### 👤 Quản lý bài đăng
* Dashboard dành cho chủ trọ để đăng tin, cập nhật thông tin và quản lý trạng thái phòng (còn trống/đã thuê).

---

## 🛠️ Công Nghệ Sử Dụng

**Frontend:**
* [Next.js 14+](https://nextjs.org/) (App Router)
* [TypeScript](https://www.typescriptlang.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Lucide React](https://lucide.dev/) (Icons)

**Bản đồ & Hình ảnh:**
* [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
* [Photo Sphere Viewer](https://photo-sphere-viewer.js.org/) (VR 360°)

**Backend & Database:**
* [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Storage)

---

## 🚀 Cài Đặt & Chạy Thử

### 1. Clone dự án
    git clone [https://github.com/AliceName/website-find-room.git](https://github.com/AliceName/website-find-room.git)
    cd website-find-room
### 2. Cài đặt thư viện
    npm install
### 3. Cấu hình biến môi trường
Tạo file .env.local ở thư mục gốc và thêm các thông tin từ Supabase của bạn:
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
### 4. Chạy dự án
    npm run dev
Truy cập http://localhost:3000 để xem kết quả.
