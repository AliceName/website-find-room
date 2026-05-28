// ===============================
// REAL ESTATE VALIDATION ENGINE v2.3 - FIXED FINAL
// ===============================

import { franc } from 'franc';

export type PostValidationInput = {
  post_title: string;
  room_price: string | number;
  room_area: string | number;
  city: string;
  district?: string;
  ward: string;
  address_detail?: string;
  latitude: number | null;
  longitude: number | null;
  room_type?: string;
};

export type FinalPostValidationInput = PostValidationInput & {
  vr_url?: string;
  room_description?: string;
  images_count?: number;
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function buildValidationMessage(errors: string[]): string {
  return errors.filter(Boolean).join("\n");
}

// ===== CONSTANTS =====
const MIN_TITLE_LENGTH = 10;
const MAX_TITLE_LENGTH = 150;
const MIN_DESCRIPTION_LEN = 20;
const MAX_DESCRIPTION_LEN = 5000;
const MIN_DESCRIPTION_WORDS = 6;
const MIN_PRICE = 500_000;
const MAX_PRICE = 150_000_000;
const MIN_AREA = 5;
const MAX_AREA = 500;
const MIN_IMAGES = 1;
const MAX_IMAGES = 8;

const VN_LAT_MIN = 8.18;
const VN_LAT_MAX = 23.39;
const VN_LNG_MIN = 102.14;
const VN_LNG_MAX = 109.46;

// ===== UTILS =====
function trim(v: string | undefined | null): string {
  return (v ?? "").trim();
}

// ĐÃ SỬA: Chấp nhận undefined
function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function parsePositiveNumber(value: string | number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : NaN;
  }

  const compact = String(value).trim().replace(/\s/g, "");
  const commaCount = (compact.match(/,/g) ?? []).length;
  const dotCount = (compact.match(/\./g) ?? []).length;

  let normalized = compact;
  if (commaCount > 0 && dotCount > 0) {
    normalized = compact.lastIndexOf(",") > compact.lastIndexOf(".")
      ? compact.replace(/\./g, "").replace(",", ".")
      : compact.replace(/,/g, "");
  } else if (commaCount > 0) {
    normalized = commaCount > 1 || /,\d{3}$/.test(compact)
      ? compact.replace(/,/g, "")
      : compact.replace(",", ".");
  } else if (dotCount > 0) {
    normalized = dotCount > 1 || /\.\d{3}$/.test(compact)
      ? compact.replace(/\./g, "")
      : compact;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
}

function hasRepeatedChars(text: string, threshold = 4): boolean {
  return new RegExp(`(.)\\1{${threshold},}`).test(text);
}

function hasExcessiveCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-ZÀ-ỹ]/g, "");
  if (letters.length < 6) return false;
  const upperCount = (text.match(/[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠ]/gu) ?? []).length;
  return upperCount / letters.length > 0.7;
}

function hasOnlyNumbers(text: string): boolean {
  return /^\d+$/.test(trim(text));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasUnitCode(text: string): boolean {
  return /\b[a-z]\d{1,2}(\.\d{1,3})?\b/i.test(text);
}

function isDuplicateWords(text: string, threshold = 0.55): boolean {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;
  const unique = new Set(words);
  return unique.size / words.length < threshold;
}

// ===== LANGUAGE DETECTION =====
const languageCache = new Map<string, { code: string; reliable: boolean }>();

function detectLanguage(text: string): { code: string; reliable: boolean } {
  const cleaned = trim(text);
  if (cleaned.length < 5) return { code: 'und', reliable: false };

  const cacheKey = cleaned.length > 100 ? cleaned.substring(0, 70) + cleaned.length : cleaned;
  if (languageCache.has(cacheKey)) return languageCache.get(cacheKey)!;

  const langCode = franc(cleaned, { minLength: 5 });
  const reliable = cleaned.length >= 12 || (cleaned.length >= 7 && langCode !== 'und');

  const result = { code: langCode, reliable };
  if (languageCache.size > 300) {
    const oldestKey = languageCache.keys().next().value;
    if (oldestKey) languageCache.delete(oldestKey);
  }
  languageCache.set(cacheKey, result);

  return result;
}

function getLanguageError(text: string): string | null {
  const { code, reliable } = detectLanguage(text);
  if (code === 'vie') return null;
  if (code === 'und' && !reliable) return null;

  if (reliable && code === 'eng') return "Tiêu đề / mô tả đang viết bằng tiếng Anh. Vui lòng viết bằng tiếng Việt.";
  if (reliable) return "Nội dung không phải tiếng Việt. Vui lòng viết bằng tiếng Việt.";

  return null;
}

function getGibberishError(text: string): string | null {
  const normalized = normalizeText(text);

  if (hasRepeatedChars(text, 4)) 
    return "Nội dung chứa quá nhiều ký tự lặp lại (ví dụ: aaaa, kkkk, asdfasdf).";
  
  if (isDuplicateWords(text, 0.52)) 
    return "Nội dung lặp từ quá nhiều, thiếu ý nghĩa.";
  
  if (normalized.length > 8 && /^([a-z])\1{3,}/i.test(normalized.replace(/\s/g, ''))) 
    return "Nội dung có dấu hiệu gõ bàn phím vô nghĩa (keyboard mashing).";

  return null;
}

// ===== DOMAIN & SPAM =====
const RE_KEYWORDS = [
  "chung cu",
  "can ho",
  "phong tro",
  "phong",
  "nha nguyen can",
  "ky tuc xa",
  "vinhomes",
  "vinhome",
  "masteri",
  "sunshine",
  "the sun",
  "the grand",
  "block",
  "tower",
  "penthouse",
  "studio",
  "officetel",
  "toilet",
  "wifi",
  "cho xe",
  "an ninh",
  "gan cho",
  "mien phi",
];

function isRealEstateContent(text: string): boolean {
  const normalized = normalizeText(text);
  if (RE_KEYWORDS.some(k => normalized.includes(k))) return true;
  if (/\b[a-z]\d{1,2}(\.\d{1,3})?\b/i.test(text)) return true;
  if (/\b\d+(?:[,.]\d+)?\s*(m2|m\^2|m²|mét vuông|met vuong)\b/iu.test(text)) return true;
  return false;
}

type SpamResult = { isSpam: boolean; reasons: string[] };

function analyzeSpam(text: string): SpamResult {
  const t = trim(text).toLowerCase();
  const reasons: string[] = [];

  if (t.length < 5) reasons.push("too_short");
  if (hasRepeatedChars(t, 4)) reasons.push("repeated_chars");
  if (!t.includes(" ") && t.length > 15) reasons.push("no_spaces");
  if (isDuplicateWords(t)) reasons.push("low_word_diversity");
  if (/[!]{3,}/.test(t)) reasons.push("excessive_exclamation");
  if (/(.{3,})\1{2,}/.test(t)) reasons.push("repeated_phrases");

  return { isSpam: reasons.length >= 2, reasons };
}

// ===== VALIDATION FUNCTIONS =====
export function validatePostTitle(postTitle: string, roomType?: string): string | null {
  const title = trim(postTitle);
  if (!title) return "Vui lòng nhập tiêu đề bài đăng.";
  if (title.length < MIN_TITLE_LENGTH && !hasUnitCode(title)) return `Tiêu đề quá ngắn (tối thiểu ${MIN_TITLE_LENGTH} ký tự).`;
  if (title.length > MAX_TITLE_LENGTH) return `Tiêu đề quá dài (tối đa ${MAX_TITLE_LENGTH} ký tự).`;
  if (hasOnlyNumbers(title)) return "Tiêu đề không được chỉ chứa toàn số.";
  if (hasExcessiveCaps(title)) return "Tiêu đề có quá nhiều chữ hoa (viết hoa toàn bộ).";

  const isRealEstateTitle = isRealEstateContent(title) || roomType === "chung_cu";
  const langError = getLanguageError(title);
  if (langError && !isRealEstateTitle) return langError;

  const gibberishError = getGibberishError(title);
  if (gibberishError) return gibberishError;

  const isRE = isRealEstateContent(title) || roomType === "chung_cu";
  if (!isRE) {
    const spam = analyzeSpam(title);
    if (spam.isSpam) return "Tiêu đề có dấu hiệu spam hoặc vô nghĩa.";
  }

  return null;
}

export function validateDescription(desc: string): string | null {
  const d = trim(desc);
  if (!d) return "Vui lòng nhập mô tả căn phòng.";
  if (d.length < MIN_DESCRIPTION_LEN) return `Mô tả quá ngắn (tối thiểu ${MIN_DESCRIPTION_LEN} ký tự).`;
  if (d.length > MAX_DESCRIPTION_LEN) return `Mô tả quá dài (tối đa ${MAX_DESCRIPTION_LEN} ký tự).`;
  if (countWords(d) < MIN_DESCRIPTION_WORDS) return `Mô tả cần ít nhất ${MIN_DESCRIPTION_WORDS} từ.`;

  const langError = getLanguageError(d);
  if (langError && !isRealEstateContent(d)) return langError;

  const gibberishError = getGibberishError(d);
  if (gibberishError) return gibberishError;

  const spam = analyzeSpam(d);
  if (spam.isSpam) return "Mô tả có dấu hiệu spam hoặc nội dung lặp lại quá nhiều.";

  return null;
}

export function validateAddress(city: string, ward: string, addressDetail?: string): string | null {
  if (!trim(city)) return "Vui lòng chọn Tỉnh / Thành phố.";
  if (!trim(ward)) return "Vui lòng chọn Phường / Xã.";

  // SỬA LỖI Ở ĐÂY: Gọi normalizeText an toàn
  if (normalizeText(city) === normalizeText(ward)) {
    return "Tỉnh/thành phố và phường/xã không được giống nhau.";
  }

  return null;
}

export function validateCoordinates(latitude: number | null, longitude: number | null): string | null {
  if (latitude === null || longitude === null) return "Vui lòng chọn vị trí trên bản đồ.";
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "Tọa độ không hợp lệ.";
  if (latitude === 0 && longitude === 0) return "Vui lòng chọn vị trí thực tế trên bản đồ.";
  if (latitude < VN_LAT_MIN || latitude > VN_LAT_MAX || longitude < VN_LNG_MIN || longitude > VN_LNG_MAX)
    return "Vị trí có vẻ nằm ngoài lãnh thổ Việt Nam. Vui lòng kiểm tra lại.";
  return null;
}

export function validatePrice(roomPrice: string | number, roomType?: string): string | null {
  const raw = String(roomPrice).trim();
  if (!raw) return "Vui lòng nhập giá thuê.";

  const price = parsePositiveNumber(roomPrice);
  if (isNaN(price)) return "Giá thuê không hợp lệ. Vui lòng chỉ nhập số.";
  if (price < MIN_PRICE) return `Giá thuê quá thấp (tối thiểu ${MIN_PRICE.toLocaleString("vi-VN")}đ/tháng).`;
  if (price > MAX_PRICE) return `Giá thuê quá cao (tối đa ${MAX_PRICE.toLocaleString("vi-VN")}đ/tháng).`;

  return null;
}

export function validateArea(roomArea: string | number, roomType?: string): string | null {
  const raw = String(roomArea).trim();
  if (!raw) return "Vui lòng nhập diện tích.";

  const area = parsePositiveNumber(roomArea);
  if (isNaN(area)) return "Diện tích không hợp lệ. Vui lòng chỉ nhập số.";
  if (area < MIN_AREA) return `Diện tích quá nhỏ (tối thiểu ${MIN_AREA}m²).`;
  if (area > MAX_AREA) return `Diện tích quá lớn (tối đa ${MAX_AREA}m²).`;

  return null;
}

export function validateImages(count: number): string | null {
  if (count < MIN_IMAGES) return `Vui lòng tải lên ít nhất ${MIN_IMAGES} hình ảnh.`;
  if (count > MAX_IMAGES) return `Tối đa ${MAX_IMAGES} hình ảnh.`;
  return null;
}

export function validateVrUrl(vrUrl?: string): string | null {
  const value = trim(vrUrl);
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return "Link VR phải dùng giao thức http hoặc https.";
    if (parsed.hostname.length < 3) return "Link VR không hợp lệ.";
  } catch {
    return "Link VR không hợp lệ (phải bắt đầu bằng https://).";
  }
  return null;
}

// ===== MAIN VALIDATION =====
export function validateBasicPostInput(input: PostValidationInput): ValidationResult {
  const errors = [
    validatePostTitle(input.post_title, input.room_type),
    validatePrice(input.room_price, input.room_type),
    validateArea(input.room_area, input.room_type),
    validateAddress(input.city, input.ward, input.address_detail),
    validateCoordinates(input.latitude, input.longitude),
  ].filter((e): e is string => Boolean(e));

  return { ok: errors.length === 0, errors, warnings: [] };
}

export function validateFinalPostInput(input: FinalPostValidationInput): ValidationResult {
  const basic = validateBasicPostInput(input);

  const extraErrors = [
    input.room_description !== undefined ? validateDescription(input.room_description) : null,
    input.images_count !== undefined ? validateImages(input.images_count) : null,
    validateVrUrl(input.vr_url),
  ].filter((e): e is string => Boolean(e));

  return {
    ok: basic.errors.length === 0 && extraErrors.length === 0,
    errors: [...basic.errors, ...extraErrors],
    warnings: [],
  };
}
