import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    // Reverse Geocoding Mode (lat, lng -> Street Address)
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ address: "Unknown Street Location" }, { status: 400 });
      }

      const cacheKey = `rev-${lat.toFixed(4)}-${lng.toFixed(4)}`;
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json(cached.data, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "HeatShield-AI-Urban-Resilience/1.0 (https://heatshield.ai)",
              "Accept-Language": "en-US,en;q=0.9",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const addr = data.address || {};
          const road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.suburb || addr.neighbourhood || "Urban Corridor";
          const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district || "";
          const city = addr.city || addr.town || addr.municipality || "City";
          const state = addr.state || "";

          let shortName = road;
          if (neighborhood && neighborhood !== road) {
            shortName += `, ${neighborhood}`;
          } else if (city) {
            shortName += `, ${city}`;
          }

          const output = {
            address: shortName,
            fullName: data.display_name || `${road}, ${city}`,
            road,
            neighborhood,
            city,
            state,
          };

          cache.set(cacheKey, { data: output, expiresAt: Date.now() + CACHE_TTL_MS });
          return NextResponse.json(output, {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
            },
          });
        }
      } catch (err) {
        console.warn("Reverse geocode fetch error:", err);
      }

      // Fallback street approximation
      const fallbackOutput = {
        address: `Street Sector (${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W)`,
        fullName: `Urban Microclimate Sector (${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W)`,
      };
      return NextResponse.json(fallbackOutput, { status: 200 });
    }

    // Forward Search Geocoding Mode (q -> Coordinates)
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const trimmedQuery = query.trim();
    const cacheKey = `fwd-${trimmedQuery.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&countrycodes=us&limit=5`,
      {
        headers: {
          "User-Agent": "HeatShield-AI-Urban-Resilience/1.0 (https://heatshield.ai)",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const data = await response.json();
    const results = (data || []).map((item: any) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
    }));

    const output = { results };
    cache.set(cacheKey, { data: output, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(output, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
