# HeatShield AI — Security Architecture & Threat Mitigation Guide

> **Version:** 2.0 (Hackathon Edition)  
> **Scope:** API Isolation, Rate Limiting, Row Level Security (RLS), AI Grounding & Public Access Safeguards

---

## 1. Threat Modeling (STRIDE Analysis)

A structured STRIDE threat model evaluates potential security risks across the HeatShield AI architecture and defines automated mitigations:

| Threat Category | Potential Vector in HeatShield AI | Mitigation Strategy |
|---|---|---|
| **Spoofing** | Attacker impersonates an urban planner or injects forged FortyGuard temperature feeds. | Supabase JWT authentication for sensitive user operations; server-side signature validation for external API ingestion. |
| **Tampering** | Malicious alteration of simulation logs, route waypoints, or temperature cache entries. | Strict PostgreSQL Row Level Security (RLS); cryptographic ID checks (`UUID v4`); server-side validation of all computed scores. |
| **Repudiation** | Dispute over saved urban heat mitigation records or alert triggers. | Immutable timestamped audit columns (`created_at TIMESTAMPTZ DEFAULT NOW()`) on all database tables. |
| **Information Disclosure** | Leakage of private API keys (`FORTYGUARD_API_KEY`, `AI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in client JavaScript bundles. | Total server-side secret isolation via Next.js Serverless Edge endpoints; zero private secrets prefixed with `NEXT_PUBLIC_`. |
| **Denial of Service (DoS)** | Automated bot spamming route calculations or LLM chat endpoints, exhausting API quotas. | IP-based rate limiting on serverless routes; LRU spatial caching; client request debouncing. |
| **Elevation of Privilege** | Normal pedestrian user executing administrative planner actions or altering other users' saved locations. | Supabase RLS policies tied to `auth.uid()` and strict `CHECK (role IN (...))` database constraints. |

---

## 2. API Key Management & Secret Isolation

### 2.1 Credential Classification Matrix

| Key / Secret | Environment Location | Target Audience | Scope & Permissions |
|---|---|---|---|
| `FORTYGUARD_API_KEY` | Server-side only (`.env.local` / Vercel Secret) | Backend API Proxy | Read-only access to FortyGuard temperature and microclimate feeds. **NEVER sent to browser.** |
| `AI_API_KEY` (Groq / Gemini) | Server-side only (`.env.local` / Vercel Secret) | Backend `/api/ai/chat` | Inference tokens for grounded assistance. **NEVER sent to browser.** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only (`.env.local` / Vercel Secret) | Backend DB Admin | Database administration & caching writes. **NEVER sent to browser.** |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Client & Server (`.env.local`) | Public Browser | Mapbox vector tile rendering & Geocoding. URL-restricted to authorized production domains in Mapbox Dashboard. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server (`.env.local`) | Public Browser | Restricted by Postgres RLS policies. Safe for public client querying. |

### 2.2 Client Bundle Leakage Prevention

All code interacting with sensitive APIs is isolated within the `/app/api/` or `/pages/api/` server directory. An automated CI lint check ensures that no private environment variable is imported into client-side components:

```typescript
// utils/env.ts — Server-Side Strict Validator
import { z } from 'zod';

const serverEnvSchema = z.object({
  FORTYGUARD_API_KEY: z.string().min(1, "FortyGuard API Key is required on server"),
  AI_API_KEY: z.string().min(1, "AI Provider API Key is required on server"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase Service Role Key is required on server"),
});

export const getValidatedServerEnv = () => {
  if (typeof window !== 'undefined') {
    throw new Error("CRITICAL SECURITY VIOLATION: Attempted to access server environment on client!");
  }
  return serverEnvSchema.parse(process.env);
};
```

---

## 3. Backend API Security & Rate Limiting

### 3.1 Rate Limiting Architecture

To protect external API credits and maintain responsive performance during hackathon judging, serverless API routes enforce rate limits using an in-memory sliding window or Redis Edge token bucket:

```typescript
// middleware/rateLimiter.ts
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  '/api/ai/chat': { windowMs: 60 * 1000, maxRequests: 15 },       // 15 AI prompts per minute
  '/api/routes/analyze': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 route queries per minute
  '/api/heat/grid': { windowMs: 60 * 1000, maxRequests: 60 },      // 60 tile queries per minute
};
```

### 3.2 Input Validation with Zod

Every incoming request payload is validated against strict schemas before executing spatial queries or mathematical scoring:

```typescript
// schemas/routeAnalysisSchema.ts
import { z } from 'zod';

export const RouteAnalysisInputSchema = z.object({
  origin: z.object({
    lat: z.number().min(24.0, "Latitude outside US coverage").max(50.0, "Latitude outside US coverage"),
    lng: z.number().min(-125.0, "Longitude outside US coverage").max(-66.0, "Longitude outside US coverage"),
    name: z.string().max(120).optional(),
  }),
  destination: z.object({
    lat: z.number().min(24.0).max(50.0),
    lng: z.number().min(-125.0).max(-66.0),
    name: z.string().max(120).optional(),
  }),
  mode: z.enum(['walking', 'cycling', 'driving']).default('walking'),
});
```

---

## 4. Supabase & Database Row Level Security (RLS)

### 4.1 Security Invariants
1. **Public Demo Access:** Hackathon judges and public guests must be able to explore the microclimate map, run route analyses, and view baseline simulation showcases **without logging in**.
2. **Authenticated Scope:** Private saved locations and personalized threshold alerts are restricted strictly to the user who created them.
3. **Immutability of Historical Cache:** Cached FortyGuard data cannot be overwritten by client-side requests; only the server-side proxy service role key can update cached heat grids.

### 4.2 RLS Policy Verification Matrix

| Table | Operation | Target Role | Policy Rule |
|---|---|---|---|
| `cached_heat_cells` | `SELECT` | `anon`, `authenticated` | `USING (true)` (Public read enabled) |
| `cached_heat_cells` | `INSERT / UPDATE` | `service_role` only | Blocked for `anon` and `authenticated` |
| `simulation_logs` | `SELECT` | `anon`, `authenticated` | `USING (true)` (Showcase simulations readable) |
| `simulation_logs` | `INSERT` | `anon`, `authenticated` | `WITH CHECK (auth.uid() = user_id OR user_id IS NULL)` |
| `saved_locations` | `SELECT / INSERT / UPDATE / DELETE` | `authenticated` only | `USING (auth.uid() = user_id)` |
| `profiles` | `SELECT / UPDATE` | `authenticated` only | `USING (auth.uid() = id)` |

---

## 5. AI Grounding & Prompt Injection Defense

To prevent prompt injection, hallucinations, and unauthorized medical advice, the AI Assistant employs a defensive multi-stage guardrail:

```
                  [ Untrusted User Input ]
                             │
                             ▼
                 [ 1. Input Sanitization ]
   (Strip markdown injections, system override keywords, limit to 400 chars)
                             │
                             ▼
            [ 2. Deterministic Context Assembly ]
 (Inject ONLY verified FortyGuard temperatures, calculated HRS, and route stats)
                             │
                             ▼
                 [ 3. Hardened System Prompt ]
        - "You are HeatShield AI environmental interpreter."
        - "You MUST base all statements on the provided data."
        - "You MUST NOT invent temperatures or medical diagnoses."
        - "Refuse off-topic questions not related to heat or navigation."
                             │
                             ▼
                 [ 4. Streaming Output Filter ]
        (Validate markdown structure and sanitize potential HTML tags)
```

---

## 6. HTTP Security Headers & Content Security Policy (CSP)

Configured within `next.config.js` or Vercel edge middleware:

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com;
      worker-src 'self' blob:;
      style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com;
      img-src 'self' data: blob: https://api.mapbox.com;
      connect-src 'self' https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com https://*.supabase.co;
      font-src 'self' https://fonts.gstatic.com;
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

---

## 7. Privacy & Geolocation Protection

1. **Ephemeral Geolocation:** When the user clicks *"Use Current Location"*, coordinates are held in volatile browser memory only for route calculation and are never logged or stored in Supabase without explicit bookmarking.
2. **Coordinate Rounding for Analytics:** Any telemetry logs anonymize user coordinates by rounding to 3 decimal places ($\approx 110\text{m}$ precision), preventing residential address identification.
3. **No PII Tracking:** No third-party tracking scripts, advertising pixels, or invasive session recorders are loaded.
