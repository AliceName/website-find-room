"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
<<<<<<< HEAD
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) fetchUserRole(user.id);
        });
=======
        const initAuth = async () => {
            const { data, error } = await supabase.auth.getUser();

            if (error) {
                if (error.message?.includes("Refresh Token Not Found")) {
                    await supabase.auth.signOut({ scope: "local" });
                }
                setUser(null);
                setUserRole(null);
                setUnreadCount(0);
                return;
            }

            const currentUser = data.user;
            setUser(currentUser);
            if (currentUser) {
                await fetchUserRole(currentUser.id);
                await fetchUnreadCount(currentUser.id);
            }
        };

        void initAuth();
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                void fetchUserRole(session.user.id);
                void fetchUnreadCount(session.user.id);
            } else {
                setUserRole(null);
                setUnreadCount(0);
            }
        });

        return () => authListener?.subscription?.unsubscribe();
    }, []);

    const fetchUserRole = async (userId: string) => {
        const { data } = await supabase
            .from("users")
            .select("user_role")
            .eq("user_id", userId)
            .single();
        if (data) setUserRole(data.user_role);
    };

    const fetchUnreadCount = async (userId: string) => {
        const { data: conversations } = await supabase
            .from("conversations")
            .select("conversation_id")
            .or(`renter_id.eq.${userId},owner_id.eq.${userId}`);

        if (!conversations || conversations.length === 0) {
            setUnreadCount(0);
            return;
        }

        const conversationIds = conversations.map((item) => item.conversation_id);
        const { count } = await supabase
            .from("messages")
            .select("message_id", { count: "exact", head: true })
            .in("conversation_id", conversationIds)
            .neq("sender_user_id", userId)
            .eq("is_read", false)
            .is("deleted_at", null);

        setUnreadCount(count ?? 0);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
        setUnreadCount(0);
        setMobileOpen(false);
        router.push("/");
        router.refresh();
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/rooms?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
        }
    };

    const isAuthPage = pathname?.startsWith("/auth");
    if (isAuthPage) return null;

    return (
<<<<<<< HEAD
        <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-[50] border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* LOGO */}
                    <Link href="/" className="text-2xl font-black text-blue-600 shrink-0">
                        FindRoom
                    </Link>

                    {/* SEARCH - desktop */}
                    <form onSubmit={handleSearch} className="flex-grow max-w-md hidden md:block">
                        <div className="flex items-center bg-gray-100 hover:bg-gray-150 rounded-2xl py-2.5 px-4 transition-colors">
                            <span className="text-gray-400 mr-2">🔍</span>
=======
        <nav className="sticky top-0 z-[50] border-b border-app bg-white/95 shadow-sm backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex h-16 items-center justify-between gap-4">
                    <Link href="/" className="shrink-0 text-2xl font-black text-blue-600 transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:scale-[1.02] hover:text-blue-700 active:scale-[0.99]">
                        FindRoom
                    </Link>

                    <form onSubmit={handleSearch} className="hidden max-w-md flex-grow md:block">
                        <div className="flex items-center rounded-2xl bg-slate-100 px-4 py-2.5 transition-all duration-[180ms] ease-[var(--ease-out-quart)] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:shadow-[0_0_0_1px_rgba(37,99,235,0.14),0_0_0_8px_rgba(37,99,235,0.06)]">
                            <span className="mr-2 text-gray-400 transition-colors duration-[180ms] ease-[var(--ease-out-quart)]">🔍</span>
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                            <input
                                type="text"
                                placeholder="Tìm phòng, khu vực..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none font-medium"
                            />
                        </div>
                    </form>

<<<<<<< HEAD
                    {/* DESKTOP NAV */}
                    <div className="hidden lg:flex items-center gap-1">
                        <NavLink href="/rooms">Tìm phòng</NavLink>
=======
                    <div className="hidden items-center gap-1 lg:flex">
                        <NavLink href="/rooms" active={pathname === "/rooms"}>Tìm phòng</NavLink>
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c

                        {user ? (
                            <>
                                <NavLink href="/chat" active={pathname?.startsWith("/chat")} badge={unreadCount > 0 ? unreadCount : undefined}>💬 Hộp thư</NavLink>
                                {userRole === 'owner' && (
                                    <NavLink href="/post">Đăng tin</NavLink>
                                )}
                                <NavLink href="/favorites">❤️ Đã lưu</NavLink>
                                <NavLink href="/manage-posts">Quản lý</NavLink>
                                <NavLink href="/profile">Hồ sơ</NavLink>
                                <button
                                    onClick={handleSignOut}
                                    className="ml-2 px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="ml-1 px-5 py-2 rounded-xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                                >
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-all"
                    >
                        <div className="w-5 space-y-1">
                            <span className={`block h-0.5 bg-gray-600 transition-all ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                            <span className={`block h-0.5 bg-gray-600 transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
                            <span className={`block h-0.5 bg-gray-600 transition-all ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                        </div>
                    </button>
                </div>
            </div>

            {mobileOpen && (
<<<<<<< HEAD
                <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
                    {/* Search on mobile */}
=======
                <div className="animate-[fadeUp_220ms_var(--ease-out-quart)_both] border-t border-gray-100 bg-white px-4 py-4 space-y-1 lg:hidden">
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                    <form onSubmit={handleSearch} className="mb-3">
                        <div className="flex items-center bg-gray-50 rounded-2xl py-2 pl-3 pr-1">
                            <span className="text-gray-400 text-lg mr-2">🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm phòng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none font-medium"
                            />
                            <button
                                type="submit"
                                className="px-3 py-2 text-blue-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                🔎
                            </button>
                        </div>
                    </form>

                    <MobileNavLink href="/rooms" onClick={() => setMobileOpen(false)}>🏠 Tìm phòng</MobileNavLink>

                    {user ? (
                        <>
<<<<<<< HEAD
                            <MobileNavLink href="/post" onClick={() => setMobileOpen(false)}>📝 Đăng tin</MobileNavLink>
                            <MobileNavLink href="/favorites" onClick={() => setMobileOpen(false)}>❤️ Tin đã lưu</MobileNavLink>
                            <MobileNavLink href="/manage-posts" onClick={() => setMobileOpen(false)}>📋 Quản lý bài đăng</MobileNavLink>
                            <MobileNavLink href="/profile" onClick={() => setMobileOpen(false)}>👤 Hồ sơ của tôi</MobileNavLink>
=======
                            <MobileNavLink href="/chat" active={pathname?.startsWith("/chat")} onClick={() => setMobileOpen(false)} badge={unreadCount > 0 ? unreadCount : undefined}>💬 Hộp thư</MobileNavLink>
                            {userRole === 'owner' && (
                                <MobileNavLink href="/post" active={pathname === "/post"} onClick={() => setMobileOpen(false)}>📝 Đăng tin</MobileNavLink>
                            )}
                            <MobileNavLink href="/favorites" active={pathname === "/favorites"} onClick={() => setMobileOpen(false)}>❤️ Tin đã lưu</MobileNavLink>
                            <MobileNavLink href="/manage-posts" active={pathname === "/manage-posts"} onClick={() => setMobileOpen(false)}>📋 Quản lý bài đăng</MobileNavLink>
                            <MobileNavLink href="/profile" active={pathname === "/profile"} onClick={() => setMobileOpen(false)}>👤 Hồ sơ của tôi</MobileNavLink>
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                            >
                                🚪 Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <MobileNavLink href="/auth/login" onClick={() => setMobileOpen(false)}>Đăng nhập</MobileNavLink>
                            <div className="pt-2">
                                <Link
                                    href="/auth/register"
                                    onClick={() => setMobileOpen(false)}
                                    className="block w-full text-center px-4 py-3 rounded-xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 transition-all"
                                >
                                    Đăng ký ngay
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}

<<<<<<< HEAD
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
=======
function NavLink({ href, children, active = false, badge }: { href: string; children: React.ReactNode; active?: boolean; badge?: number }) {
    return (
        <Link
            href={href}
            className={`relative rounded-xl px-4 py-2 text-sm font-bold transition-all duration-[180ms] ease-[var(--ease-out-quart)] hover:scale-[1.01] active:scale-[0.98] ${active ? 'bg-slate-100 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm'}`}
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
        >
            <span className="inline-flex items-center gap-2">
                {children}
                {typeof badge === "number" && badge > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black leading-none text-white shadow-sm">
                        {badge > 99 ? "99+" : badge}
                    </span>
                )}
            </span>
        </Link>
    );
}

<<<<<<< HEAD
function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
=======
function MobileNavLink({ href, children, onClick, active = false, badge }: { href: string; children: React.ReactNode; onClick: () => void; active?: boolean; badge?: number }) {
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
    return (
        <Link
            href={href}
            onClick={onClick}
<<<<<<< HEAD
            className="block px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
=======
            className={`relative block rounded-xl px-4 py-3 text-sm font-bold transition-all duration-[180ms] ease-[var(--ease-out-quart)] ${active ? 'bg-slate-100 text-slate-950 shadow-sm' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
>>>>>>> b2ba66bc35f45c1472b3ded61e3657e1a93f695c
        >
            <span className="inline-flex items-center gap-2">
                {children}
                {typeof badge === "number" && badge > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black leading-none text-white shadow-sm">
                        {badge > 99 ? "99+" : badge}
                    </span>
                )}
            </span>
        </Link>
    );
}
