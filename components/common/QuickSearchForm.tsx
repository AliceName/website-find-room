"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";

interface QuickSearchFormProps {
  placeholder?: string;
  buttonLabel?: string;
}

export default function QuickSearchForm({
  placeholder = "Thủ Đức, Bình Thạnh, Quận 1...",
  buttonLabel = "Tìm ngay",
}: QuickSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/rooms?search=${encodeURIComponent(trimmed)}` : "/rooms");
  };

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <AutocompleteInput
        value={query}
        onChange={setQuery}
        fetchUrl="/api/autocomplete"
        placeholder={placeholder}
        icon={<Search className="h-5 w-5" />}
        className="flex-1"
        inputClassName="h-14 w-full rounded-2xl border border-sky-200 bg-white pl-12 pr-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0EA5E9] focus:ring-4 focus:ring-sky-100"
      />

      <button
        type="submit"
        className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] px-8 font-bold text-white hover:brightness-105"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
