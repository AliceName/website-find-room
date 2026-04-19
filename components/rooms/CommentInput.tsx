'use client'
import { useState } from "react";
import Input from "@/components/common/Input";

export default function CommentInput() {
    const [comment, setComment] = useState("");

    return (
        <Input
            label="Bình luận"
            placeholder="Thêm bình luận..."
            value={comment}
            onChange={setComment}
        />
    );
}