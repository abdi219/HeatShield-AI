import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchFortyGuardGrid } from "@/lib/fortyguard";

const GridQuerySchema = z.object({
  swLat: z.coerce.number().min(-90).max(90),
  swLng: z.coerce.number().min(-180).max(180),
  neLat: z.coerce.number().min(-90).max(90),
  neLng: z.coerce.number().min(-180).max(180),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = GridQuerySchema.safeParse({
      swLat: searchParams.get("swLat"),
      swLng: searchParams.get("swLng"),
      neLat: searchParams.get("neLat"),
      neLng: searchParams.get("neLng"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid bounding box coordinates", details: parsed.error.format() },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Failed to generate microclimate heat grid" },
      { status: 500 }
    );
  }
}
