"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Bookmark,
    Search,
    SlidersHorizontal,
    RotateCcw,
    X,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

import {
    AutocompleteInput,
    SearchFilter,
    Pagination,
    EmptyState,
    Loader,
} from "@/components/common";

import type { SearchFilters } from "@/components/common";
import type { AutocompleteOption } from "@/components/common";
import { ROOM_TYPES } from "@/components/common/SearchFilter";

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center rounded-[2rem] border border-sky-100 bg-white">
            <div className="flex items-center gap-3 text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0EA5E9] border-t-transparent" />
                Đang tải bản đồ...
            </div>
        </div>
    ),
});

interface PostWithDetails {
    post_id: string;
    post_title: string;
    post_created_at: string | null;
    view_count: number | null;
    rooms: {
        room_id: string;
        room_price: number;
        room_area: number | null;
        room_status: boolean | null;
        vr_url: string | null;
        latitude: number | string | null;
        longitude: number | string | null;
        is_hidden?: boolean | null;
        room_types: {
            room_type_id: string;
            room_type_name: string;
        } | null;
        roomimages: {
            image_url: string;
            is_360: boolean | null;
        }[];
        locations: {
            location_id: string;
            city: string;
            district: string;
            ward: string;
        } | null;
        roomamenities: {
            amenity_id: string;
            amenities: {
                amenity_id: string;
                amenity_name: string;
            } | null;
        }[];
    } | null;
}

type ChatRoomResultsPayload = {
    postIds?: string[];
    focusPostId?: string;
    source?: string;
};

const CHAT_RESULTS_STORAGE_KEY = "findroom:pending-chat-results";
const CHAT_RESULTS_EVENT = "findroom:chat-room-results";

const CHAT_FILTER_SOURCE = "chatbot";

function parseOptionalNumber(value: string | null): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function RoomsContent() {
    const searchParams = useSearchParams();
    const focusLat = parseOptionalNumber(searchParams.get("focusLat"));
    const focusLng = parseOptionalNumber(searchParams.get("focusLng"));
    const focusPostId = searchParams.get("focusPostId") ?? undefined;
    const focusTitle = searchParams.get("focusTitle") ?? undefined;
    const openRoute = searchParams.get("openRoute") === "1";

    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [filtered, setFiltered] = useState<PostWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setIsMapOpen] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [quickKeyword, setQuickKeyword] = useState("");
    const [mapFocusTarget, setMapFocusTarget] = useState<{
        lat: number;
        lng: number;
        title?: string;
        postId?: string;
    } | null>(null);
    const [isChatFiltered, setIsChatFiltered] = useState(false);
    const [mapSelectedCity, setMapSelectedCity] = useState<string | undefined>(undefined);

    const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
    const [allAmenities, setAllAmenities] = useState<
        { amenity_id: string; amenity_name: string }[]
    >([]);

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedPosts = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setQuickKeyword(currentFilters.keyword ?? "");
    }, [currentFilters.keyword]);

    useEffect(() => {
        const applyChatResults = (payload: ChatRoomResultsPayload | null) => {
            const postIds = Array.isArray(payload?.postIds)
                ? payload.postIds.filter((id): id is string => typeof id === "string" && id.length > 0)
                : [];

            if (postIds.length === 0) return;

            if (posts.length === 0) {
                window.sessionStorage.setItem(CHAT_RESULTS_STORAGE_KEY, JSON.stringify(payload));
                return;
            }

            const order = new Map(postIds.map((id, index) => [id, index]));
            const matchedPosts = posts
                .filter((post) => order.has(post.post_id))
                .sort((a, b) => (order.get(a.post_id) ?? 0) - (order.get(b.post_id) ?? 0));

            if (matchedPosts.length === 0) return;

            const focusPost =
                (payload?.focusPostId
                    ? matchedPosts.find((post) => post.post_id === payload.focusPostId)
                    : null) ?? matchedPosts[0];

            if (focusPost) {
                const lat = Number(focusPost.rooms?.latitude);
                const lng = Number(focusPost.rooms?.longitude);
                if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
                    setMapFocusTarget({
                        lat,
                        lng,
                        title: focusPost.post_title,
                        postId: focusPost.post_id,
                    });
                }
            }

            setIsFiltering(true);
            setFiltered(matchedPosts);
            setCurrentPage(1);
            setIsMapOpen(true);
            setIsChatFiltered(payload?.source === CHAT_FILTER_SOURCE || payload?.source === "gemini-chat");

            requestAnimationFrame(() => {
                setIsFiltering(false);
                document.getElementById("rooms-map-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        };

        const handleChatResults = (event: Event) => {
            applyChatResults((event as CustomEvent<ChatRoomResultsPayload>).detail ?? null);
        };

        window.addEventListener(CHAT_RESULTS_EVENT, handleChatResults);

        const pending = window.sessionStorage.getItem(CHAT_RESULTS_STORAGE_KEY);
        if (pending) {
            try {
                const payload = JSON.parse(pending) as ChatRoomResultsPayload;
                if (posts.length > 0) {
                    window.sessionStorage.removeItem(CHAT_RESULTS_STORAGE_KEY);
                }
                applyChatResults(payload);
            } catch {
                window.sessionStorage.removeItem(CHAT_RESULTS_STORAGE_KEY);
            }
        }

        return () => window.removeEventListener(CHAT_RESULTS_EVENT, handleChatResults);
    }, [posts]);

    useEffect(() => {
        const searchQuery = searchParams.get("search");
        if (searchQuery && posts.length > 0) {
            handleSearch({
                ...currentFilters,
                keyword: searchQuery,
            });
        }
    }, [searchParams, posts]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [postsRes, amenitiesRes] = await Promise.all([
                supabase
                    .from("posts")
                    .select(`
                        post_id,
                        post_title,
                        post_created_at,
                        view_count,
                        rooms:room_id (
                            room_id,
                            room_price,
                            room_area,
                            room_status,
                            is_hidden,
                            vr_url,
                            latitude,
                            longitude,
                            room_types:room_type_id (
                                room_type_id,
                                room_type_name
                            ),
                            roomimages (
                                image_url,
                                is_360
                            ),
                            locations:location_id (
                                location_id,
                                city,
                                district,
                                ward
                            ),
                            roomamenities (
                                amenity_id,
                                amenities (
                                    amenity_id,
                                    amenity_name
                                )
                            )
                        )
                    `)
                    .order("post_created_at", { ascending: false }),

                supabase
                    .from("amenities")
                    .select("amenity_id, amenity_name")
                    .order("amenity_name", { ascending: true }),
            ]);

            if (postsRes.data) {
                const visiblePosts = (postsRes.data as unknown as PostWithDetails[]).filter(
                    (post) => post.rooms?.is_hidden !== true && post.rooms?.room_status !== false
                );
                setPosts(visiblePosts);
                setFiltered(visiblePosts);
            }

            if (amenitiesRes.data) {
                setAllAmenities(amenitiesRes.data);
            }
        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    const parseRange = (rangeStr: string | undefined): [number | undefined, number | undefined] => {
        if (!rangeStr || !rangeStr.includes("-")) return [undefined, undefined];
        const [min, max] = rangeStr.split("-");
        return [min ? Number(min) : undefined, max ? Number(max) : undefined];
    };

    const cityOptions = useMemo(() => {
        const counts = new Map<string, number>();
        posts.forEach((p) => {
            const city = p.rooms?.locations?.city;
            if (city) counts.set(city, (counts.get(city) || 0) + 1);
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([city, count]) => ({
                value: city,
                label: `${city} (${count})`,
            }));
    }, [posts]);

    const districtOptions = useMemo(() => {
        const counts = new Map<string, number>();
        posts.forEach((p) => {
            const loc = p.rooms?.locations;
            const wardOrDistrict = loc?.ward || loc?.district;
            if (wardOrDistrict) {
                if (!currentFilters.city || loc.city === currentFilters.city) {
                    counts.set(wardOrDistrict, (counts.get(wardOrDistrict) || 0) + 1);
                }
            }
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([district, count]) => ({
                value: district,
                label: `${district} (${count})`,
            }));
    }, [posts, currentFilters.city]);

    const amenityOptions = useMemo(() => {
        return allAmenities.map((a) => ({
            value: a.amenity_id,
            label: a.amenity_name,
        }));
    }, [allAmenities]);

    const keywordSuggestions = useMemo<AutocompleteOption[]>(() => {
        const suggestions: AutocompleteOption[] = [];
        const seen = new Set<string>();

        const add = (value?: string | null, description?: string) => {
            const text = value?.trim();
            if (!text) return;
            const key = text
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            suggestions.push({ value: text, label: text, description });
        };

        posts.forEach((post) => {
            add(post.post_title, "Tin đăng");
            const loc = post.rooms?.locations;
            add([loc?.ward || loc?.district, loc?.city].filter(Boolean).join(", "), "Khu vực");
            add(loc?.city, "Thành phố");
        });

        return suggestions;
    }, [posts]);

    const handleSearch = (filters: SearchFilters) => {
        setIsFiltering(true);
        setCurrentFilters(filters);
        setMapSelectedCity(filters.city || undefined);
        setIsChatFiltered(false);

        let result = [...posts];

        if (filters.keyword?.trim()) {
            const q = filters.keyword.toLowerCase();
            result = result.filter((p) =>
                p.post_title.toLowerCase().includes(q) ||
                p.rooms?.locations?.district?.toLowerCase().includes(q) ||
                p.rooms?.locations?.ward?.toLowerCase().includes(q) ||
                p.rooms?.locations?.city?.toLowerCase().includes(q)
            );
        }

        if (filters.roomType) {
            const targetLabel = ROOM_TYPES.find((t) => t.value === filters.roomType)?.label;
            if (targetLabel) {
                result = result.filter((p) => p.rooms?.room_types?.room_type_name === targetLabel);
            }
        }

        if (filters.priceRange) {
            const [minPrice, maxPrice] = parseRange(filters.priceRange);
            result = result.filter((p) => {
                const price = p.rooms?.room_price || 0;
                if (minPrice !== undefined && maxPrice !== undefined) {
                    return price >= minPrice && price <= maxPrice;
                }
                if (minPrice !== undefined) return price >= minPrice;
                return true;
            });
        }

        if (filters.areaRange) {
            const [minArea, maxArea] = parseRange(filters.areaRange);
            result = result.filter((p) => {
                const area = p.rooms?.room_area || 0;
                if (minArea !== undefined && maxArea !== undefined) {
                    return area >= minArea && area <= maxArea;
                }
                if (minArea !== undefined) return area >= minArea;
                return true;
            });
        }

        if (filters.city) {
            result = result.filter((p) => p.rooms?.locations?.city === filters.city);
        }
        if (filters.district) {
            result = result.filter((p) => {
                const loc = p.rooms?.locations;
                return (loc?.ward || loc?.district) === filters.district;
            });
        }
        if (filters.amenities && filters.amenities.length > 0) {
            result = result.filter((p) => {
                const roomAmenityIds = p.rooms?.roomamenities?.map((ra) => ra.amenity_id) || [];
                return filters.amenities!.every((id) => roomAmenityIds.includes(id));
            });
        }

        // Sort
        switch (filters.sortBy || "newest") {
            case "price_asc":
                result.sort((a, b) => (a.rooms?.room_price || 0) - (b.rooms?.room_price || 0));
                break;
            case "price_desc":
                result.sort((a, b) => (b.rooms?.room_price || 0) - (a.rooms?.room_price || 0));
                break;
            case "area_asc":
                result.sort((a, b) => (a.rooms?.room_area || 0) - (b.rooms?.room_area || 0));
                break;
            case "area_desc":
                result.sort((a, b) => (b.rooms?.room_area || 0) - (a.rooms?.room_area || 0));
                break;
            case "oldest":
                // Tin cũ nhất -> tăng dần theo post_created_at
                result.sort((a, b) =>
                    new Date(a.post_created_at || 0).getTime() -
                    new Date(b.post_created_at || 0).getTime()
                );
                break;
            default:
                // Tin mới nhất -> giảm dần theo post_created_at
                result.sort((a, b) =>
                    new Date(b.post_created_at || 0).getTime() - new Date(a.post_created_at || 0).getTime()
                );
        }


        setFiltered(result);
        setCurrentPage(1);
        requestAnimationFrame(() => setIsFiltering(false));
    };

    const handleReset = () => {
        setCurrentFilters({});
        setFiltered(posts);
        setCurrentPage(1);
        setIsChatFiltered(false);
        setMapFocusTarget(null);
        setMapSelectedCity(undefined);
    };

    const handleResetChatFilter = () => {
        setFiltered(posts);
        setCurrentPage(1);
        setIsChatFiltered(false);
        setMapFocusTarget(null);
        setMapSelectedCity(undefined);
        window.sessionStorage.removeItem(CHAT_RESULTS_STORAGE_KEY);
    };

    const handleMapAreaSelect = ({ city }: { city: string }) => {
        handleSearch({
            ...currentFilters,
            city,
            district: "",
        });
    };

    const handleMapAreaClear = () => {
        const { city, district, ...restFilters } = currentFilters;
        handleSearch(restFilters);
    };

    const handleFocusPostOnMap = (post: PostWithDetails) => {
        const lat = Number(post.rooms?.latitude);
        const lng = Number(post.rooms?.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return;

        setMapFocusTarget({
            lat,
            lng,
            title: post.post_title,
            postId: post.post_id,
        });
        setIsMapOpen(true);
        requestAnimationFrame(() => {
            document.getElementById("rooms-map-section")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    const handleQuickSearch = () => {
        handleSearch({
            ...currentFilters,
            keyword: quickKeyword.trim(),
        });
    };

    return (
        <div className="h-screen overflow-hidden bg-white text-slate-900">
            <div className="grid h-full grid-cols-1 lg:grid-cols-[40vw_60vw]">
                <aside className="z-20 flex min-h-0 flex-col border-r border-slate-200 bg-white lg:h-screen">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-7 py-4">
                        <Link
                            href="/"
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                            aria-label="Về trang chủ"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleQuickSearch();
                            }}
                            className="flex-1"
                        >
                            <AutocompleteInput
                                value={quickKeyword}
                                onChange={setQuickKeyword}
                                onSelect={(value) => {
                                    handleSearch({
                                        ...currentFilters,
                                        keyword: value.trim(),
                                    });
                                }}
                                suggestions={keywordSuggestions}
                                fetchUrl="/api/autocomplete"
                                placeholder="Tìm phòng trọ, căn hộ..."
                                icon={<Search className="h-5 w-5" />}
                                inputClassName="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
                            />
                        </form>
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                            aria-label="Mở bộ lọc"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </button>
                    </div>

                    {isChatFiltered ? (
                        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="text-sm font-semibold text-emerald-900">
                                Bạn đang xem danh sách phòng được lọc từ chatbot.
                            </p>
                            <button
                                type="button"
                                onClick={handleResetChatFilter}
                                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-emerald-700"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Hiện tất cả phòng
                            </button>
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between px-7 py-4">
                        <p className="text-sm font-bold text-slate-700">
                            <span className="text-emerald-700">⚡ {Math.min(filtered.length, posts.length).toLocaleString("vi-VN")} tin phù hợp</span>
                            <span className="mx-2 text-slate-300">·</span>
                            <span className="text-slate-950">{posts.length.toLocaleString("vi-VN")} kết quả</span>
                        </p>
                        {Object.values(currentFilters).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value)) ? (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-xs font-bold text-slate-500 underline underline-offset-4 transition hover:text-slate-900"
                            >
                                Xóa lọc
                            </button>
                        ) : null}
                    </div>

                    <div className={`min-h-0 flex-1 overflow-y-auto px-7 pb-8 transition-opacity ${isFiltering ? "opacity-70" : "opacity-100"}`}>
                        {loading ? (
                            <Loader fullScreen={false} text="Đang tìm phòng phù hợp..." />
                        ) : filtered.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                                <EmptyState
                                    icon="🏚️"
                                    title="Không tìm thấy phòng"
                                    description="Hãy thử nới lỏng bộ lọc hoặc đổi khu vực"
                                    action={{ label: "Đặt lại bộ lọc", onClick: handleReset }}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-x-5 gap-y-6 xl:grid-cols-2">
                                    {paginatedPosts.map((post, index) => (
                                        <motion.div
                                            key={post.post_id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <div
                                                onClick={() => handleFocusPostOnMap(post)}
                                                className="block w-full cursor-pointer rounded-[22px] text-left transition hover:-translate-y-0.5"
                                            >
                                                <CompactRoomCard post={post} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {totalPages > 1 ? (
                                    <div className="mt-6 flex justify-center pb-4">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                            canPreviousPage={currentPage > 1}
                                            canNextPage={currentPage < totalPages}
                                        />
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </aside>

                <main id="rooms-map-section" className="relative min-h-[520px] bg-white p-3 lg:h-screen">
                    <div className="h-full w-full overflow-hidden rounded-[18px]">
                        <MapView
                            posts={filtered}
                            areaPosts={posts}
                            filters={currentFilters}
                            focusTarget={mapFocusTarget ?? ((focusPostId && focusLat !== null && focusLng !== null) ? { lat: focusLat, lng: focusLng, title: focusTitle, postId: focusPostId } : (focusLat !== null && focusLng !== null ? { lat: focusLat, lng: focusLng, title: focusTitle } : null))}
                            openRoutePanel={openRoute}
                            selectedAreaCity={mapSelectedCity ?? currentFilters.city}
                            onAreaSelect={handleMapAreaSelect}
                            onAreaClear={handleMapAreaClear}
                        />
                    </div>
                </main>
            </div>

            <AnimatePresence>
                {isFilterModalOpen ? (
                    <motion.div
                        className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="max-h-[86vh] w-[min(720px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white shadow-2xl"
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFilterModalOpen(false)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                                    aria-label="Đóng bộ lọc"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <h2 className="text-lg font-black text-slate-950">Bộ lọc</h2>
                                <span className="h-9 w-9" />
                            </div>
                            <div className="max-h-[calc(86vh-73px)] overflow-y-auto p-5">
                                <SearchFilter
                                    key={`${currentFilters.keyword ?? ""}|${currentFilters.city ?? ""}|${currentFilters.district ?? ""}|modal`}
                                    onSearch={(filters) => {
                                        handleSearch(filters);
                                        setQuickKeyword(filters.keyword ?? "");
                                    }}
                                    onReset={handleReset}
                                    onMapClick={() => setIsMapOpen(true)}
                                    isMapOpen={true}
                                    cityOptions={cityOptions}
                                    districtOptions={districtOptions}
                                    amenityOptions={amenityOptions}
                                    keywordSuggestions={keywordSuggestions}
                                    selectedFilters={currentFilters}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function CompactRoomCard({ post }: { post: PostWithDetails }) {
    const thumbnail =
        post.rooms?.roomimages?.find((image) => image.is_360 === false)?.image_url ||
        post.rooms?.roomimages?.[0]?.image_url ||
        "/placeholder-room.jpg";
    const price = post.rooms?.room_price
        ? post.rooms.room_price >= 1_000_000
            ? `${(post.rooms.room_price / 1_000_000).toFixed(1).replace(/\.0$/, "")} triệu/tháng`
            : `${post.rooms.room_price.toLocaleString("vi-VN")} đ/tháng`
        : "Liên hệ";
    const location = post.rooms?.locations;
    const locationText = location
        ? [location.ward || location.district, location.city].filter(Boolean).join(", ")
        : "Chưa cập nhật vị trí";
    const roomType = post.rooms?.room_types?.room_type_name ?? "Phòng";
    const hasVR = !!(post.rooms?.vr_url || post.rooms?.roomimages?.some((image) => image.is_360));

    return (
        <article className="group overflow-hidden rounded-[22px] bg-white transition">
            <div className="relative aspect-[1.22] overflow-hidden rounded-[18px] bg-slate-100">
                {thumbnail !== "/placeholder-room.jpg" ? (
                    <img
                        src={thumbnail}
                        alt={post.post_title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">
                        <div className="text-center">
                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">⌂</div>
                            <p className="text-sm font-bold text-slate-600">Cho thuê</p>
                        </div>
                    </div>
                )}
                <span className="absolute left-3 top-3 max-w-[calc(100%-4.5rem)] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
                    {roomType}
                </span>
                <button
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950"
                    aria-label="Lưu phòng"
                >
                    <Bookmark className="h-5 w-5" />
                </button>
                {hasVR ? (
                    <span className="absolute bottom-3 left-3 rounded-full bg-purple-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                        VR
                    </span>
                ) : null}
            </div>

            <div className="px-0 py-3">
                <div className="mb-1 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 min-h-[42px] text-base font-black leading-snug text-slate-950">
                        {post.post_title}
                    </h3>
                    <span className="shrink-0 text-xs font-bold text-slate-500">★ {post.view_count ?? 0}</span>
                </div>
                <p className="line-clamp-1 text-sm font-bold text-slate-500">{locationText}</p>
                <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-500">
                    <span>{post.rooms?.room_area ?? "--"}m²</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="truncate">{roomType}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-base font-black text-slate-950 underline decoration-1 underline-offset-2">{price}</p>
                    <Link
                        href={`/rooms/${post.post_id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    >
                        Chi tiết
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default function RoomsPage() {
    return (
        <Suspense fallback={<Loader fullScreen />}>
            <RoomsContent />
        </Suspense>
    );
}
