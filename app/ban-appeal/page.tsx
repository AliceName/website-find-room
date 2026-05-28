"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { BanAppealService } from "@/lib/services/ban-appeal.service";

function BanAppealContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await BanAppealService.submitAppeal({ email, message });
      setSuccess("Đã gửi yêu cầu mở lại tài khoản. Admin sẽ xem xét và phản hồi theo thông tin tài khoản của bạn.");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi yêu cầu mở khóa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <main className="mx-auto max-w-2xl">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">Tài khoản bị khóa</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Gửi yêu cầu mở lại tài khoản</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hãy nhập email của tài khoản bị khóa và mô tả lý do bạn muốn admin xem xét lại. Nếu đã có yêu cầu đang chờ, hệ thống sẽ giữ yêu cầu hiện tại.
              </p>
            </div>
          </div>

          {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
          {success && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{success}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-bold text-slate-700">
              Email tài khoản
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@email.com"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Nội dung yêu cầu
              <textarea
                required
                rows={7}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Trình bày ngắn gọn lý do, cam kết chỉnh sửa bài đăng hoặc thông tin bổ sung để admin xem xét..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Gửi yêu cầu
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default function BanAppealPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">Đang tải...</div>}>
      <BanAppealContent />
    </Suspense>
  );
}
