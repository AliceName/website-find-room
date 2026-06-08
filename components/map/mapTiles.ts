const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY?.trim();

export const MAP_TILE_CONFIG = VIETMAP_API_KEY
  ? {
      attribution: '&copy; <a href="https://vietmap.vn" target="_blank" rel="noreferrer">Vietmap</a>',
      url: `https://maps.vietmap.vn/api/tm/{z}/{x}/{y}@2x.png?apikey=${encodeURIComponent(VIETMAP_API_KEY)}`,
    }
  : {
      attribution: "&copy; OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    };
