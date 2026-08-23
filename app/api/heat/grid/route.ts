import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchFortyGuardGrid } from "@/lib/fortyguard";

export const dynamic = "force-dynamic";

const GridQuerySchema = z.object({
  swLat: z.coerce.number().transform((v) => Math.max(-85, Math.min(85, v))),
  swLng: z.coerce.number().transform((v) => Math.max(-180, Math.min(180, v))),
  neLat: z.coerce.number().transform((v) => Math.max(-85, Math.min(85, v))),
  neLng: z.coerce.number().transform((v) => Math.max(-180, Math.min(180, v))),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = GridQuerySchema.safeParse({
      swLat: searchParams.get("swLat") || "33.43",
      swLng: searchParams.get("swLng") || "-112.10",
      neLat: searchParams.get("neLat") || "33.47",
      neLng: searchParams.get("neLng") || "-112.05",
    });

    if (!parsed.success) {
      // Graceful fallback to Phoenix bounding box
      const fallbackGrid = await fetchFortyGuardGrid(33.43, -112.10, 33.47, -112.05);
      return NextResponse.json(fallbackGrid, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    const { swLat, swLng, neLat, neLng } = parsed.data;
    const gridData = await fetchFortyGuardGrid(swLat, swLng, neLat, neLng);

    return NextResponse.json(gridData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Heat Grid API Error:", error);
    try {
      const fallbackGrid = await fetchFortyGuardGrid(33.43, -112.10, 33.47, -112.05);
      return NextResponse.json(fallbackGrid, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to generate microclimate heat grid" },
        { status: 500 }
      );
    }
  }
}
