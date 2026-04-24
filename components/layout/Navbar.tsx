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
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) fetchUserRole(user.id);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchUserRole(session.user.id);
            else setUserRole(null);
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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
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

    // Hide on auth pages
    const isAuthPage = pathname?.startsWith("/auth");
    if (isAuthPage) return null;

    return (
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
                            <input
                                type="text"
                                placeholder="Tìm phòng, khu vực..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none font-medium"
                            />
                        </div>
                    </form>

                    {/* DESKTOP NAV */}
                    <div className="hidden lg:flex items-center gap-1">
                        <NavLink href="/rooms">Tìm phòng</NavLink>

                        {user ? (
                            <>
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

                    {/* MOBILE MENU TOGGLE */}
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

            {/* MOBILE MENU */}
            {mobileOpen && (
                <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
                    {/* Search on mobile */}
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
                            <MobileNavLink href="/post" onClick={() => setMobileOpen(false)}>📝 Đăng tin</MobileNavLink>
                            <MobileNavLink href="/favorites" onClick={() => setMobileOpen(false)}>❤️ Tin đã lưu</MobileNavLink>
                            <MobileNavLink href="/manage-posts" onClick={() => setMobileOpen(false)}>📋 Quản lý bài đăng</MobileNavLink>
                            <MobileNavLink href="/profile" onClick={() => setMobileOpen(false)}>👤 Hồ sơ của tôi</MobileNavLink>
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
        >
            {children}
        </Link>
    );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="block px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
        >
            {children}
        </Link>
    );
}
