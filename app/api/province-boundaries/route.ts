import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import union from "@turf/union";
import type {
  Feature as GeoJsonFeature,
  FeatureCollection as GeoJsonFeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Polygon,
} from "geojson";

type BoundaryProperties = {
  shapeName?: string;
  osmId?: number;
  source?: string;
  appCityName?: string;
  sourceShapeNames?: string;
  sourceUpdatedAt?: string | null;
  offshoreArchipelago?: boolean;
  sovereigntyMask?: boolean;
  archipelagoName?: string;
  labelPoint?: [number, number];
  maritimeZone?: string;
  radiusNauticalMiles?: number;
  legalBasis?: string;
  [key: string]: unknown;
};

type GeoFeature = GeoJsonFeature<Polygon | MultiPolygon, BoundaryProperties>;

type BoundaryCollection = GeoJsonFeatureCollection<Polygon | MultiPolygon, BoundaryProperties> & {
  metadata?: {
    source?: string;
    sourceName?: string;
    sourceUpdatedAt?: string | null;
    srid?: number;
    featureCount?: number;
  };
};

const OSM_BOUNDARY_FILE = path.join(process.cwd(), "data", "vn-osm-adm1-boundaries.geojson");
const FALLBACK_BOUNDARY_FILE = path.join(process.cwd(), "data", "vn-geoboundaries-adm1-boundaries.geojson");
const BOUNDARY_CACHE_VERSION = "osm-local-land-v14-vnsdi-archipelago-hand-fit";

let cachedOsmBoundaries: BoundaryCollection | null = null;
let cachedFallbackBoundaries: BoundaryCollection | null = null;
const cachedMergedBoundaries = new Map<string, BoundaryCollection>();

const MERGED_PROVINCE_PARTS: Record<string, string[]> = {
  "ha noi": ["Ha Noi"],
  "cao bang": ["Cao Bang"],
  "tuyen quang": ["Tuyen Quang", "Ha Giang"],
  "dien bien": ["Dien Bien"],
  "lai chau": ["Lai Chau"],
  "son la": ["Son La"],
  "lao cai": ["Lao Cai", "Yen Bai"],
  "thai nguyen": ["Thai Nguyen", "Bac Kan"],
  "lang son": ["Lang Son"],
  "quang ninh": ["Quang Ninh"],
  "bac ninh": ["Bac Ninh", "Bac Giang"],
  "phu tho": ["Phu Tho", "Vinh Phuc", "Hoa Binh"],
  "hai phong": ["Hai Phong", "Hai Duong"],
  "hung yen": ["Hung Yen", "Thai Binh"],
  "ninh binh": ["Ninh Binh", "Nam Dinh", "Ha Nam"],
  "thanh hoa": ["Thanh Hoa"],
  "nghe an": ["Nghe An"],
  "ha tinh": ["Ha Tinh"],
  "quang tri": ["Quang Tri", "Quang Binh"],
  "hue": ["Thua Thien Hue"],
  "da nang": ["Da Nang", "Quang Nam"],
  "quang ngai": ["Quang Ngai", "Kon Tum"],
  "gia lai": ["Gia Lai", "Binh Dinh"],
  "khanh hoa": ["Khanh Hoa", "Ninh Thuan"],
  "dak lak": ["Dak Lak", "Phu Yen"],
  "lam dong": ["Lam Dong", "Dak Nong", "Binh Thuan"],
  "dong nai": ["Dong Nai", "Binh Phuoc"],
  "ho chi minh": ["Ho Chi Minh", "Binh Duong", "Ba Ria-Vung Tau", "Ba Ria–Vung Tau"],
  "tay ninh": ["Tay Ninh", "Long An"],
  "dong thap": ["Dong Thap", "Tien Giang"],
  "vinh long": ["Vinh Long", "Ben Tre", "Tra Vinh"],
  "an giang": ["An Giang", "Kien Giang"],
  "can tho": ["Can Tho", "Hau Giang", "Soc Trang"],
  "ca mau": ["Ca Mau", "Bac Lieu"],
};

const OFFSHORE_ARCHIPELAGO_BOUNDARIES: Record<string, Array<{
  shapeName: string;
  coordinates: MultiPolygon["coordinates"];
  labelPoint: [number, number];
}>> = {
  "da nang": [
    {
      shapeName: "Quần đảo Hoàng Sa",
      labelPoint: [112.1, 16.45],
      coordinates: [
        [[
          [110.44, 16.52],
          [110.68, 15.74],
          [111.18, 15.18],
          [112.00, 14.96],
          [112.92, 15.10],
          [113.78, 15.40],
          [114.38, 15.86],
          [114.28, 16.36],
          [113.58, 16.80],
          [112.68, 17.14],
          [111.76, 17.30],
          [110.98, 17.16],
          [110.52, 16.88],
          [110.44, 16.52],
        ]],
      ],
    },
  ],
  "khanh hoa": [
    {
      shapeName: "Quần đảo Trường Sa",
      labelPoint: [114.35, 9.2],
      coordinates: [
        [[
          [111.42, 8.82],
          [111.88, 8.06],
          [112.78, 7.18],
          [113.82, 6.68],
          [114.88, 6.56],
          [115.72, 6.94],
          [116.42, 7.66],
          [116.76, 8.62],
          [116.58, 9.48],
          [115.94, 10.08],
          [115.00, 10.52],
          [113.88, 10.82],
          [112.84, 10.54],
          [112.04, 9.82],
          [111.42, 8.82],
        ]],
      ],
    },
  ],
};

const OFFSHORE_LEGAL_SEA_AREAS: Record<string, Array<{
  shapeName: string;
  labelPoint: [number, number];
  coverCoordinates: MultiPolygon["coordinates"];
}>> = {
  "da nang": [
    {
      shapeName: "Qu\u1ea7n \u0111\u1ea3o Ho\u00e0ng Sa",
      labelPoint: [112.1, 16.45],
      coverCoordinates: [
        [[
          [110.44, 16.52],
          [110.68, 15.74],
          [111.18, 15.18],
          [112.00, 14.96],
          [112.92, 15.10],
          [113.78, 15.40],
          [114.38, 15.86],
          [114.28, 16.36],
          [113.58, 16.80],
          [112.68, 17.14],
          [111.76, 17.30],
          [110.98, 17.16],
          [110.52, 16.88],
          [110.44, 16.52],
        ]],
      ],
    },
  ],
  "khanh hoa": [
    {
      shapeName: "Qu\u1ea7n \u0111\u1ea3o Tr\u01b0\u1eddng Sa",
      labelPoint: [114.35, 9.2],
      coverCoordinates: [
        [[
          [111.42, 8.82],
          [111.88, 8.06],
          [112.78, 7.18],
          [113.82, 6.68],
          [114.88, 6.56],
          [115.72, 6.94],
          [116.42, 7.66],
          [116.76, 8.62],
          [116.58, 9.48],
          [115.94, 10.08],
          [115.00, 10.52],
          [113.88, 10.82],
          [112.84, 10.54],
          [112.04, 9.82],
          [111.42, 8.82],
        ]],
      ],
    },
  ],
};

function normalizeProvinceName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/^tp\.?\s*/i, "")
    .replace(/^thanh pho\s+/i, "")
    .replace(/^tinh\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function readBoundaryFile(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as BoundaryCollection;
}

async function getOsmBoundaries() {
  cachedOsmBoundaries ??= await readBoundaryFile(OSM_BOUNDARY_FILE);
  return cachedOsmBoundaries;
}

async function getFallbackBoundaries() {
  cachedFallbackBoundaries ??= await readBoundaryFile(FALLBACK_BOUNDARY_FILE);
  return cachedFallbackBoundaries;
}

function makeNameIndex(collection: BoundaryCollection) {
  return new Map(
    collection.features
      .map((feature) => {
        const shapeName = feature.properties?.shapeName;
        return shapeName ? [normalizeProvinceName(shapeName), feature] as const : null;
      })
      .filter(Boolean) as Array<readonly [string, GeoFeature]>,
  );
}

function getRequestedPartNames(name: string) {
  const normalizedName = normalizeProvinceName(name);
  return MERGED_PROVINCE_PARTS[normalizedName] ?? [name];
}

function resolveFeaturesForName(
  requestedName: string,
  osmIndex: Map<string, GeoFeature>,
  fallbackIndex: Map<string, GeoFeature>,
) {
  const directOsmFeature = osmIndex.get(normalizeProvinceName(requestedName));
  if (directOsmFeature) return { features: [directOsmFeature], source: "openstreetmap-land" };

  const parts = getRequestedPartNames(requestedName);
  const osmPartFeatures = parts
    .map((part) => osmIndex.get(normalizeProvinceName(part)))
    .filter(Boolean) as GeoFeature[];
  if (osmPartFeatures.length > 0) return { features: osmPartFeatures, source: "openstreetmap-land" };

  const fallbackFeatures = parts
    .map((part) => fallbackIndex.get(normalizeProvinceName(part)))
    .filter(Boolean) as GeoFeature[];
  return { features: fallbackFeatures, source: "geoboundaries-land" };
}

function mergeProvinceFeatures(
  requestedName: string,
  provinceParts: GeoFeature[],
  source: string,
  sourceUpdatedAt: string | null,
) {
  if (provinceParts.length === 0) return null;

  const sourceNames = provinceParts
    .map((feature) => feature.properties?.shapeName)
    .filter(Boolean)
    .join(", ");
  const properties: BoundaryProperties = {
    appCityName: requestedName,
    source,
    sourceShapeNames: sourceNames,
    sourceUpdatedAt,
    clippedToLand: true,
  };

  if (provinceParts.length === 1) {
    return {
      ...provinceParts[0],
      properties: {
        ...provinceParts[0].properties,
        ...properties,
      },
    };
  }

  const featureCollection: GeoJsonFeatureCollection<Polygon | MultiPolygon, GeoJsonProperties> = {
    type: "FeatureCollection",
    features: provinceParts.map((feature) => ({
      type: "Feature",
      properties: feature.properties,
      geometry: feature.geometry,
    })) as GeoJsonFeature<Polygon | MultiPolygon, GeoJsonProperties>[],
  };
  return union(featureCollection, { properties }) as GeoFeature | null;
}

function getArchipelagoDisplayName(requestedName: string) {
  const normalizedName = normalizeProvinceName(requestedName);
  if (normalizedName === "da nang") return "Qu\u1ea7n \u0111\u1ea3o Ho\u00e0ng Sa";
  if (normalizedName === "khanh hoa") return "Qu\u1ea7n \u0111\u1ea3o Tr\u01b0\u1eddng Sa";
  return null;
}

function getOffshoreArchipelagoFeatures(requestedName: string): GeoFeature[] {
  const archipelagos = OFFSHORE_LEGAL_SEA_AREAS[normalizeProvinceName(requestedName)] ?? [];
  const archipelagoDisplayName = getArchipelagoDisplayName(requestedName);

  return archipelagos.flatMap((archipelago) => {
    const displayName = archipelagoDisplayName ?? archipelago.shapeName;
    const baseProperties = {
      shapeName: displayName,
      appCityName: requestedName,
      source: "app-offshore-archipelago-bounds",
      sourceShapeNames: displayName,
      sourceUpdatedAt: null,
      offshoreArchipelago: true,
      archipelagoName: displayName,
      labelPoint: archipelago.labelPoint,
    } satisfies BoundaryProperties;

    const coverFeature: GeoFeature = {
      type: "Feature",
      properties: {
        ...baseProperties,
        maritimeZone: "archipelago-extent-reference",
        legalBasis: "V\u00f9ng n\u00e9t \u0111\u1ee9t tham chi\u1ebfu v\u1ecb tr\u00ed c\u1ee5m \u0111\u1ea3o theo c\u00e1ch hi\u1ec3n th\u1ecb b\u1ea3n \u0111\u1ed3 h\u00e0nh ch\u00ednh; kh\u00f4ng ph\u1ea3i ranh gi\u1edbi l\u00e3nh h\u1ea3i ch\u00ednh th\u1ee9c.",
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: archipelago.coverCoordinates,
      },
    };

    return [coverFeature];
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const names = (searchParams.get("names") ?? "")
    .split("|")
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 80);

  if (names.length === 0) {
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }

  try {
    const cacheKey = `${BOUNDARY_CACHE_VERSION}:${names.map(normalizeProvinceName).sort().join("|")}`;
    const cached = cachedMergedBoundaries.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const osmBoundaries = await getOsmBoundaries();
    const fallbackBoundaries = await getFallbackBoundaries();
    const osmIndex = makeNameIndex(osmBoundaries);
    const fallbackIndex = makeNameIndex(fallbackBoundaries);

    const features = names.flatMap((name) => {
      const resolved = resolveFeaturesForName(name, osmIndex, fallbackIndex);
      const sourceUpdatedAt =
        resolved.source === "openstreetmap-land"
          ? osmBoundaries.metadata?.sourceUpdatedAt ?? null
          : fallbackBoundaries.metadata?.sourceUpdatedAt ?? null;
      const merged = mergeProvinceFeatures(name, resolved.features, resolved.source, sourceUpdatedAt);
      const offshoreArchipelagoFeatures = getOffshoreArchipelagoFeatures(name);
      return merged ? [merged, ...offshoreArchipelagoFeatures] : offshoreArchipelagoFeatures;
    });

    const response: BoundaryCollection = {
      type: "FeatureCollection",
      metadata: {
        source: "openstreetmap-land",
        sourceName: "Local OSM admin_level=4 boundaries clipped to OSM land polygons; geoBoundaries land-clipped fallback for missing OSM provinces; app-maintained offshore archipelago bounds for Hoang Sa and Truong Sa",
        sourceUpdatedAt: osmBoundaries.metadata?.sourceUpdatedAt ?? null,
        srid: 4326,
        featureCount: features.length,
      },
      features,
    };
    cachedMergedBoundaries.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải ranh giới tỉnh/thành";
    return NextResponse.json({ error: message, type: "FeatureCollection", features: [] }, { status: 502 });
  }
}
