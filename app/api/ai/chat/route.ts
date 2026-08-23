import { NextRequest, NextResponse } from "next/server";
import { buildGroundedSystemPrompt, AIRequestContext } from "@/lib/aiContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b"; // Active 120B model on Groq

/**
 * Fallback synthesizer in case of API rate limits or network issues.
 * Synthesizes a factual, grounded microclimate intelligence response without emojis.
 */
function generateDeterministicFallback(
  userQuery: string,
  context?: AIRequestContext
): string {
  const query = userQuery.toLowerCase();
  const loc = context?.location;
  const a = loc?.assessment;
  const r = context?.routes;
  const sim = context?.simulation?.result;

  if (query.includes("cool route") || query.includes("route") || query.includes("faster") || query.includes("direct")) {
    if (r?.fastestRoute && r?.coolRoute) {
      const fast = r.fastestRoute;
      const cool = r.coolRoute;
      const tempDiff = (fast.averageTempCelsius - cool.averageTempCelsius).toFixed(1);
      const minDiff = Math.max(0, Math.round((cool.durationSeconds - fast.durationSeconds) / 60));
      return `### Route Microclimate Analysis

Based on FortyGuard high-resolution thermal grid telemetry along **${r.originName || "Origin"}** to **${r.destinationName || "Destination"}**:

- **Cool Corridor Heat Savings:** The Cool Route reduces average surface heat exposure by **-${cool.exposureReductionPct}%** (**${cool.averageTempCelsius.toFixed(1)}°C** vs **${fast.averageTempCelsius.toFixed(1)}°C** direct asphalt exposure).
- **Time Trade-Off:** The shaded detour requires only **+${minDiff} min** of additional walking time for a **${tempDiff}°C** cooler pedestrian journey.
- **HeatShield Score:** The recommended route scores **${cool.heatShieldScore}/100** vs **${fast.heatShieldScore}/100** for the direct sun corridor.

**Recommendation:**
1. **Pedestrian Comfort:** For pedestrians, seniors, and active commuting, the **Cool Route** provides significantly lower cardiovascular thermal strain.
2. **Direct Transit:** If travel time is critical, the **Direct Route** saves ${minDiff} min, but direct sun exposure on unshaded asphalt peaks at **${fast.peakTempCelsius.toFixed(1)}°C**.`;
    }
  }

  if (query.includes("what-if") || query.includes("simulation") || query.includes("tree") || query.includes("cool pavement") || query.includes("mitigat")) {
    if (sim) {
      return `### Urban Heat Mitigation Analysis

Based on your active What-If Simulation for **${sim.locationName}**:

- **Simulated Cooling Impact:** Net surface temperature drop of **-${sim.temperatureReductionDelta.toFixed(1)}°C** (from **${sim.baselineSurfaceTemp.toFixed(1)}°C** down to **${sim.simulatedSurfaceTemp.toFixed(1)}°C**).
- **Heat Risk Reduction:** Heat Risk Score drops by **-${sim.heatRiskScoreReductionDelta} points** (from **${sim.baselineHeatRiskScore}/100** to **${sim.simulatedHeatRiskScore}/100**).
- **Effective Cooling Radius:** The microclimate cooling oasis extends approximately **~${sim.estimatedCoolingRadiusMeters} meters** across surrounding city blocks.

**Urban Planning Insights:**
1. **Tree Canopy Evapotranspiration:** Expanding canopy to **${sim.interventions.treeCanopyCoveragePct}%** provides natural radiant shading and active latent heat dissipation.
2. **High-Albedo Pavements:** Increasing solar reflectance to **${sim.interventions.coolPavementAlbedo.toFixed(2)} α** prevents thermal mass absorption in street asphalt.`;
    }
  }

  // General Location Analysis
  if (a && loc) {
    return `### Microclimate Assessment for ${loc.address || "Inspected Sector"}

- **Current Surface Temperature:** **${a.surfaceTemp.toFixed(1)}°C** (${(a.surfaceTemp * 1.8 + 32).toFixed(1)}°F)
- **Ambient Air Temperature:** **${a.ambientTemp.toFixed(1)}°C** (${(a.ambientTemp * 1.8 + 32).toFixed(1)}°F)
- **Thermal Anomaly:** **+${a.deltaAnomaly.toFixed(1)}°C** above ambient equilibrium.
- **Heat Risk Score (HRS):** **${a.score}/100 [${a.level.toUpperCase()} RISK]**

**Contributing Urban Factors:**
- **Surface Albedo Penalty (+${Math.round(a.contributingFactors.surfaceAlbedoPenalty)}%):** Dark asphalt surfaces are absorbing heavy direct solar radiation.
- **Canopy Deficit (+${Math.round(a.contributingFactors.vegetationDeficitPenalty)}%):** Lack of overhead tree shade increases direct radiation load on pedestrians.

**Immediate Guidance:**
1. **Pedestrians:** Limit continuous direct sun exposure to under 20 minutes during midday peak hours.
2. **Hydration & Route Choice:** Use parallel shaded streets or coastal/park corridors where possible.`;
  }

  return `### HeatShield AI Copilot

I am your urban microclimate intelligence assistant powered by FortyGuard hyper-local telemetry.

- **Explore Hotspots:** Click any location on the map to inspect street-level surface temperatures and Heat Risk Scores.
- **Cool Route Finder:** Plan pedestrian or bike commutes with real-time shaded thermal corridors.
- **What-If Simulator:** Test urban cooling interventions (tree canopies, cool pavement coatings, solar roofs) in real time.

How can I assist your urban heat resilience planning today?`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      context?: AIRequestContext;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages array" }, { status: 400 });
    }

    const latestUserMessage = messages[messages.length - 1]?.content || "";
    const systemPrompt = buildGroundedSystemPrompt(context);
    const apiKey = process.env.GROQ_API_KEY?.trim() || process.env.AI_API_KEY?.trim();

    // If Groq API Key is available, invoke Groq with streaming
    if (apiKey && apiKey.startsWith("gsk_")) {
      try {
        const groqPayload = {
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.35,
          max_tokens: 1024,
          stream: true,
        };

        const groqRes = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(groqPayload),
        });

        if (groqRes.ok && groqRes.body) {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();

          const stream = new ReadableStream({
            async start(controller) {
              const reader = groqRes.body!.getReader();
              let buffer = "";

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith(":")) continue;
                    if (trimmed === "data: [DONE]") {
                      controller.close();
                      return;
                    }

                    if (trimmed.startsWith("data: ")) {
                      try {
                        const json = JSON.parse(trimmed.slice(6));
                        const deltaContent = json.choices?.[0]?.delta?.content;
                        if (deltaContent) {
                          controller.enqueue(encoder.encode(deltaContent));
                        }
                      } catch {
                        // Skip malformed chunk
                      }
                    }
                  }
                }
                controller.close();
              } catch (err) {
                controller.error(err);
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
            },
          });
        } else {
          const errText = await groqRes.text();
          console.warn("Groq API non-200 response, switching to deterministic fallback:", errText);
        }
      } catch (groqErr) {
        console.warn("Groq API stream fetch error:", groqErr);
      }
    }

    // Deterministic Physical Synthesis Fallback Stream
    const fallbackText = generateDeterministicFallback(latestUserMessage, context);
    const encoder = new TextEncoder();

    const fallbackStream = new ReadableStream({
      async start(controller) {
        // Stream text in words for realistic smooth typing animation
        const words = fallbackText.split(" ");
        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? " " : "");
          controller.enqueue(encoder.encode(word));
          await new Promise((resolve) => setTimeout(resolve, 18));
        }
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI Chat API Route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
