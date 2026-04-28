import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ post_id: string }> }
) {
    try {
        const { post_id } = await params;

        if (!post_id) {
            return NextResponse.json(
                { error: "Thiếu post_id" },
                { status: 400 }
            );
        }

        // Dùng RPC function để tăng view_count (bypass RLS an toàn)
        const { data: newCount, error: rpcError } = await supabase
            .rpc("increment_post_view", {
                post_id_param: post_id,
            });

        if (rpcError) {
            return NextResponse.json(
                { error: rpcError.message || "Lỗi khi cập nhật lượt xem" },
                { status: 500 }
            );
        }

        return NextResponse.json({ view_count: newCount ?? 0 });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Lỗi server" },
            { status: 500 }
        );
    }
}
