import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type Suggestion = {
  value: string;
  label?: string;
  description?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function addSuggestion(items: Suggestion[], seen: Set<string>, suggestion: Suggestion) {
  const key = normalize(suggestion.value);
  if (!key || seen.has(key)) return;
  seen.add(key);
  items.push(suggestion);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit") ?? 8);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 12) : 8;

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const [postsRes, locationsRes] = await Promise.all([
      supabase
        .from("posts")
        .select("post_title")
        .ilike("post_title", `%${query}%`)
        .order("post_created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("locations")
        .select("city, district, ward")
        .or(`city.ilike.%${query}%,district.ilike.%${query}%,ward.ilike.%${query}%`)
        .limit(limit * 2),
    ]);

    if (postsRes.error || locationsRes.error) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions: Suggestion[] = [];
    const seen = new Set<string>();

    postsRes.data?.forEach((post) => {
      if (post.post_title) {
        addSuggestion(suggestions, seen, {
          value: post.post_title,
          label: post.post_title,
          description: "Tin đăng",
        });
      }
    });

    locationsRes.data?.forEach((location) => {
      const parts = [location.ward || location.district, location.city].filter(Boolean);
      if (parts.length) {
        addSuggestion(suggestions, seen, {
          value: parts.join(", "),
          label: parts.join(", "),
          description: "Khu vực",
        });
      }
      if (location.city) {
        addSuggestion(suggestions, seen, {
          value: location.city,
          label: location.city,
          description: "Thành phố",
        });
      }
    });

    return NextResponse.json({ suggestions: suggestions.slice(0, limit) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
