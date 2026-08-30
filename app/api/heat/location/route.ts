import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchFortyGuardLocation } from "@/lib/fortyguard";

export const dynamic = "force-dynamic";

const LocationQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = LocationQuerySchema.safeParse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { lat, lng } = parsed.data;
    const result = await fetchFortyGuardLocation(lat, lng);

    return NextResponse.json(
      {
        success: true,
        point: result.point,
        assessment: result.assessment,
        activityId: (result as any).activityId,
        source: (result as any).source || result.point.source,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error("Location Heat API Error:", error);
    return NextResponse.json(
      { error: "Failed to assess location microclimate" },
      { status: 500 }
    );
  }
}
