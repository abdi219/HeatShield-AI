import { z } from "zod";

/**
 * Server-side Environment Variables Schema
 * Strictly enforced to prevent unauthorized access and runtime crashes.
 */
const serverEnvSchema = z.object({
  FORTYGUARD_API_KEY: z.string().optional().default("demo_key"),
  FORTYGUARD_API_BASE_URL: z.string().url().optional().default("https://api.fortyguard.com/v1"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  AI_PROVIDER: z.enum(["groq", "gemini"]).optional().default("groq"),
  AI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().optional().default("llama-3.1-70b-versatile"),
});

/**
 * Client-side Public Environment Variables Schema
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional().default(""),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().default("https://example.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
});

export const getServerEnv = () => {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: Server environment accessed from client browser!");
  }
  return serverEnvSchema.parse(process.env);
};

export const getClientEnv = () => {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
};
