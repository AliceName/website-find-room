"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, Lock, ArrowLeft, Sparkles, Loader2 } from "lucide-react";

function getAuthRedirectState() {
  if (typeof window === "undefined") {
    return { error: null, hasRecoveryParams: false };
  }

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorDescription =
    hashParams.get("error_description") ??
    params.get("error_description") ??
    hashParams.get("error") ??
    params.get("error");
  const hasRecoveryParams =
    params.get("type") === "recovery" ||
    hashParams.get("type") === "recovery" ||
    params.has("access_token") ||
    hashParams.has("access_token") ||
    params.has("refresh_token") ||
    hashParams.has("refresh_token") ||
    params.has("token_hash") ||
    hashParams.has("token_hash");

  return {
    error: errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, " ")) : null,
    hasRecoveryParams,
  };
}

async function getSessionWithTimeout() {
  const timeout = new Promise<null>((resolve) => {
    window.setTimeout(() => resolve(null), 3000);
  });

  return Promise.race([supabase.auth.getSession(), timeout]);
}

function ResetPasswordContent() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const redirectState = getAuthRedirectState();
    if (redirectState.error) {
      setError(redirectState.error);
    }

    const initRecoverySession = async () => {
      const sessionResult = await getSessionWithTimeout();
      if (!active) return;

      if (!sessionResult) {
        if (redirectState.hasRecoveryParams && !redirectState.error) {
          setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
        setCheckingSession(false);
        return;
      }

      const { data, error: sessionError } = sessionResult;

      if (sessionError) {
        setError(sessionError.message);
      }

      if (data.session) {
        setRecoveryReady(true);
      } else if (redirectState.hasRecoveryParams && !redirectState.error) {
        setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      }

      setCheckingSession(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryReady(true);
        setError(null);
      }

      setCheckingSession(false);
    });

    void initRecoverySession();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess(null);
      if (recoveryReady) setError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [success, error, recoveryReady]);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (!recoveryReady) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut({ scope: "local" });

      setSuccess("Đặt lại mật khẩu thành công! Đang chuyển hướng...");

      setTimeout(() => {
        router.push("/auth/login");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const showInvalidLinkWarning = !checkingSession && !recoveryReady && !error;

  return (
    <div className="relative flex min-h-screen bg-[#F0F9FF] text-slate-800 overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute left-[-180px] top-[-120px] h-[520px] w-[520px] rounded-full bg-[#7DD3FC]/50 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-160px] h-[480px] w-[480px] rounded-full bg-[#0EA5E9]/30 blur-[130px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] shadow-lg shadow-sky-300">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">FindRoom</h1>
                <p className="text-xs tracking-widest text-slate-500">RESET PASSWORD</p>
              </div>
            </Link>
          </div>

          <div className="rounded-[32px] border border-sky-100 bg-white p-8 shadow-2xl md:p-10">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0EA5E9]">TÀI KHOẢN</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Đặt lại mật khẩu</h2>
              <p className="mt-2 text-slate-600">
                Nhập mật khẩu mới để tiếp tục sử dụng tài khoản của bạn.
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {checkingSession && (
              <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                Đang kiểm tra liên kết đặt lại mật khẩu...
              </div>
            )}

            {showInvalidLinkWarning && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy mở lại email để lấy liên kết đúng.
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-12 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-11 pr-12 text-slate-800 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100 outline-none"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || checkingSession || !recoveryReady}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] py-4 text-base font-bold text-white shadow-lg shadow-sky-300 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <Loader2 size={20} className="animate-spin" /> Đang đặt lại...
                  </span>
                ) : (
                  "ĐẶT LẠI MẬT KHẨU"
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="flex w-full items-center justify-center gap-2 py-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </button>

              <p className="text-center text-xs text-slate-500">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email.
              </p>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={14} /> Về trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F9FF] text-slate-700">
      Đang tải...
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
