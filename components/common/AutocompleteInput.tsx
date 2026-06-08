"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface AutocompleteOption {
  value: string;
  label?: string;
  description?: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  suggestions?: AutocompleteOption[];
  fetchUrl?: string;
  placeholder?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
  minLength?: number;
  limit?: number;
  ariaLabel?: string;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function uniqueOptions(options: AutocompleteOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = normalize(option.value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  suggestions = [],
  fetchUrl,
  placeholder,
  name,
  className = "",
  inputClassName = "",
  icon,
  minLength = 2,
  limit = 8,
  ariaLabel,
}: AutocompleteInputProps) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [remoteSuggestions, setRemoteSuggestions] = useState<AutocompleteOption[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [listPosition, setListPosition] = useState({ left: 0, top: 0, width: 0 });

  const localMatches = useMemo(() => {
    const query = normalize(value);
    if (query.length < minLength) return [];

    return uniqueOptions(suggestions)
      .filter((option) => {
        const text = normalize(`${option.value} ${option.label ?? ""} ${option.description ?? ""}`);
        return text.includes(query);
      })
      .slice(0, limit);
  }, [limit, minLength, suggestions, value]);

  useEffect(() => {
    if (!fetchUrl || normalize(value).length < minLength) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const separator = fetchUrl.includes("?") ? "&" : "?";
        const res = await fetch(`${fetchUrl}${separator}q=${encodeURIComponent(value)}&limit=${limit}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { suggestions?: AutocompleteOption[] };
        setRemoteSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRemoteSuggestions([]);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchUrl, limit, minLength, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = useMemo(
    () => uniqueOptions([...localMatches, ...remoteSuggestions]).slice(0, limit),
    [limit, localMatches, remoteSuggestions],
  );

  const showList = open && value.trim().length >= minLength && options.length > 0;

  useEffect(() => {
    if (!showList || !inputRef.current) return;

    const updatePosition = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setListPosition({
        left: rect.left,
        top: rect.bottom + 8,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showList]);

  const selectOption = (option: AutocompleteOption) => {
    onChange(option.value);
    onSelect?.(option.value);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current <= 0 ? options.length - 1 : current - 1));
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      selectOption(options[highlightedIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {icon ? <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">{icon}</span> : null}
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        aria-autocomplete="list"
        aria-controls={showList ? listId : undefined}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />

      {showList ? (
        <div
          id={listId}
          role="listbox"
          style={{
            left: listPosition.left,
            top: listPosition.top,
            width: listPosition.width,
          }}
          className="fixed z-[3000] max-h-[min(280px,calc(100vh-120px))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15"
        >
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              role="option"
              aria-selected={highlightedIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
              className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                highlightedIndex === index ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="block truncate text-sm font-semibold">{option.label ?? option.value}</span>
              {option.description ? <span className="block truncate text-xs text-slate-500">{option.description}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
