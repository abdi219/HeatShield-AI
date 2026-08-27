# HeatShield AI
## Security Architecture & Threat Mitigation Specifications

**Document Version:** 3.0  
**Target Event:** FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure  
**Scope:** API Token Isolation, Rate Limiting, Content Security Policy (CSP), AI Grounding & Public Access Safeguards

---

## 1. Threat Modeling (STRIDE Analysis)

A structured STRIDE threat model evaluates potential security vectors across HeatShield AI and defines automated mitigations:

| Threat Category | Potential Vector in HeatShield AI | Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates an urban planner or injects forged FortyGuard temperature feeds. | Server-side signature validation for external API ingestion; optional Supabase JWT authentication for sensitive operations. |
| **Tampering** | Malicious alteration of simulation calculations, route waypoints, or temperature cache entries. | Server-side verification of all computed physics formulas and routing metrics; read-only client consumption. |
| **Repudiation** | Dispute over saved urban heat mitigation records or alert triggers. | Immutable timestamped audit entries (`created_at TIMESTAMPTZ DEFAULT NOW()`) on saved report records. |
| **Information Disclosure** | Leakage of private API keys (`FORTYGUARD_API_KEY`, `GROQ_API_KEY`) in client JavaScript bundles. | Total server-side secret isolation via Next.js Serverless Route Handlers; zero private secrets prefixed with `NEXT_PUBLIC_`. |
| **Denial of Service (DoS)** | Bot spamming route calculations or LLM chat endpoints, exhausting API quotas. | In-memory spatial LRU caching (`TTL = 300s`); client request debouncing; serverless route concurrency limits. |
| **Elevation of Privilege** | Normal pedestrian user executing administrative planner actions. | Separation of public exploration modes from planner export workflows; optional Row Level Security (RLS) enforcement. |

---

## 2. API Key Management & Secret Isolation

### 2.1 Credential Classification Matrix

| Key / Secret | Environment Location | Target Scope | Security Policy |
| :--- | :--- | :--- | :--- |
| `FORTYGUARD_API_KEY` | Server-side only (`.env.local` / Vercel Secret) | Backend API Proxy (`/api/heat/*`) | Read-only access to FortyGuard temperature feeds. **NEVER bundled in client code.** |
| `GROQ_API_KEY` | Server-side only (`.env.local` / Vercel Secret) | Backend AI Proxy (`/api/ai/chat`) | Low-latency inference for grounded copilot. **NEVER bundled in client code.** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only (`.env.local` / Vercel Secret) | Backend DB Admin (Optional) | Database administration & caching writes. **NEVER bundled in client code.** |
| `SUPABASE_ANON_KEY` | Client & Server (`.env.local`) | Public Client Sync (Optional) | Restricted by Postgres Row Level Security (RLS) policies. Safe for public client querying. |

### 2.2 Client Bundle Leakage Prevention

All code interacting with third-party APIs is strictly contained within `/app/api/` serverless route handlers. A Zod-powered environment validation schema fails the build immediately if server secrets are mistakenly imported into browser code:

```typescript
import { z } from "zod";

const serverEnvSchema = z.object({
  FORTYGUARD_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  FORTYGUARD_API_BASE_URL: z.string().default("https://api.fortyguard.com/v1"),
});

export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("CRITICAL SECURITY VIOLATION: Server environment accessed from browser client bundle.");
  }
  return serverEnvSchema.parse(process.env);
}
```

---

## 3. Content Security Policy (CSP) & Network Headers

Configured in `next.config.mjs`, strict security headers protect the application against cross-site scripting (XSS), clickjacking, and unauthorized data exfiltration:

```javascript
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://*.tile.openstreetmap.org https://unpkg.com",
      "connect-src 'self' https://api.fortyguard.com https://api.groq.com https://router.project-osrm.org https://nominatim.openstreetmap.org",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];
```

---

## 4. Grounded AI Privacy & Non-Hallucination Safeguards

* **Zero Training on User Prompts:** Prompts sent to the Groq Llama 3 120B model are processed ephemerally with zero data retention.
* **Strict Spatial Grounding:** System instructions lock the model to the physical telemetry provided in the request context (measured surface temperature, calculated Heat Risk Score, route exposure deltas).
* **Local Storage Isolation:** Chat history and session titles are stored purely in the user's local browser `localStorage`. No chat transcripts are stored on remote servers.
