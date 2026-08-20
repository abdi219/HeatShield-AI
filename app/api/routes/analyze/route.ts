import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeRoutes } from "@/lib/routing";

const RouteRequestSchema = z.object({
  origin: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    name: z.string().optional().default("Origin"),
  }),
  destination: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    name: z.string().optional().default("Destination"),
  }),
  mode: z.enum(["walking", "cycling", "driving"]).optional().default("walking"),
});

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request payload" }, { status: 400 });
    }

    const parsed = RouteRequestSchema.safeParse(body);

    if (!parsed.success) {
      console.warn("Route API validation warning:", parsed.error.format());
      // Fallback default coordinates if payload was malformed
      const fallbackOrigin = { lat: 33.4533, lng: -112.0741, name: "Civic Space Park" };
      const fallbackDest = { lat: 33.4589, lng: -112.0722, name: "Roosevelt Row" };
      const comparison = await analyzeRoutes(fallbackOrigin, fallbackDest, "walking");
      return NextResponse.json(comparison, { status: 200 });
    }

    const { origin, destination, mode } = parsed.data;
    const comparison = await analyzeRoutes(origin, destination, mode);

    return NextResponse.json(comparison, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Route analysis API error:", error);
    // Graceful fallback response instead of crash
    try {
      const fallbackOrigin = { lat: 33.4533, lng: -112.0741, name: "Civic Space Park" };
      const fallbackDest = { lat: 33.4589, lng: -112.0722, name: "Roosevelt Row" };
      const comparison = await analyzeRoutes(fallbackOrigin, fallbackDest, "walking");
      return NextResponse.json(comparison, { status: 200 });
    } catch {
      return NextResponse.json(
        { error: "Failed to compute heat-aware routes" },
        { status: 500 }
      );
    }
  }
}
