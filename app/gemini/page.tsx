"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";

export default function GeminiPlaygroundPage() {
  const [prompt, setPrompt] = useState(
    "Viết mô tả ngắn, hấp dẫn cho một phòng trọ 1 phòng ngủ ở Thủ Đức, giá 3.5 triệu/tháng.",
  );
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const parts = [
          typeof data?.error === "string" ? data.error : "Không thể gọi Gemini API",
          typeof data?.code === "string" ? `(${data.code})` : null,
          typeof data?.retryAfter === "string"
            ? `Thử lại sau ~${data.retryAfter}.`
            : null,
        ].filter(Boolean);
        throw new Error(parts.join(" "));
      }

      setResult(data?.text?.trim() || "Không có nội dung trả về.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] px-4 py-12 text-slate-800">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-sky-100 bg-white p-8 shadow-2xl md:p-12">
        <div className="flex items-center gap-3 text-[#0EA5E9]">
          <Sparkles className="h-6 w-6" />
          <span className="font-bold uppercase tracking-[0.18em] text-xs">Gemini Playground</span>
        </div>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
          Test Gemini API qua backend an toàn
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Nội dung được gửi qua API route của Next.js, nên API key không lộ ra frontend.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="w-full rounded-3xl border border-sky-200 bg-slate-50 px-5 py-4 text-slate-800 outline-none transition focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100"
            placeholder="Nhập prompt của bạn..."
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] px-6 py-3 font-bold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {loading ? "Đang xử lý..." : "Gửi tới Gemini"}
          </button>
        </form>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50 p-6">
            <h2 className="font-bold text-slate-900">Kết quả</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{result}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
