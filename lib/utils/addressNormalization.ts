export type AdministrativeAddress = {
  city?: string;
  district?: string;
  ward?: string;
  address_detail?: string;
  full_address?: string;
  province_code?: string;
  district_code?: string;
  ward_code?: string;
};

function toNormalized(value?: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPrefixes(value?: string) {
  return toNormalized(value)
    .replace(/^tp\.?\s*/g, "")
    .replace(/^thanh pho\s*/g, "")
    .replace(/^tinh\s*/g, "")
    .replace(/^quan\s*/g, "")
    .replace(/^huyen\s*/g, "")
    .replace(/^thi xa\s*/g, "")
    .replace(/^phuong\s*/g, "")
    .replace(/^xa\s*/g, "")
    .replace(/^thi tran\s*/g, "")
    .trim();
}

export function normalizeAdministrativeName(value?: string) {
  return stripPrefixes(value);
}

export function isMeaningfulAdministrativeName(value?: string) {
  const normalized = normalizeAdministrativeName(value);
  return Boolean(normalized) && !/^\d+$/.test(normalized) && !/^[\d\s.-]+$/.test(normalized);
}

export function findBestAdministrativeMatch<T extends { name: string }>(list: T[], target?: string) {
  const normalizedTarget = normalizeAdministrativeName(target);
  if (!normalizedTarget) return null;

  const exact = list.find((item) => normalizeAdministrativeName(item.name) === normalizedTarget);
  if (exact) return exact;

  const loose = list.find((item) => {
    const normalizedItem = normalizeAdministrativeName(item.name);
    return normalizedItem.includes(normalizedTarget) || normalizedTarget.includes(normalizedItem);
  });
  if (loose) return loose;

  const tokens = normalizedTarget.split(" ").filter(Boolean);
  return (
    list.find((item) => {
      const normalizedItem = normalizeAdministrativeName(item.name);
      return tokens.length > 0 && tokens.every((token) => normalizedItem.includes(token));
    }) ?? null
  );
}

export function buildAdministrativeFullAddress(parts: AdministrativeAddress) {
  return [parts.address_detail, parts.ward, parts.district, parts.city].filter(Boolean).join(", ");
}
