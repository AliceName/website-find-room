/**
 * Format a date string to relative time in Vietnamese
 * e.g. "Vừa xong", "5 phút trước", "2 giờ trước", "1 ngày trước"
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (isNaN(diffMs) || diffMs < 0) return "";

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
        return "Vừa xong";
    }
    if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    }
    if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    }
    if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    }
    if (diffWeeks < 4) {
        return `${diffWeeks} tuần trước`;
    }
    if (diffMonths < 12) {
        return `${diffMonths} tháng trước`;
    }
    return `${diffYears} năm trước`;
}

