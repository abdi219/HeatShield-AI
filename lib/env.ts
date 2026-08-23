import { z } from "zod";

/**
 * Server-side Environment Variables Schema
 * Strictly validated to ensure secure runtime operation.
 */
const serverEnvSchema = z.object({
  FORTYGUARD_API_KEY: z.string().optional().default("demo_key"),
  FORTYGUARD_API_BASE_URL: z.string().url().optional().default("https://api.fortyguard.com/v1"),
  GROQ_API_KEY: z.string().optional().default(""),
  AI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().optional().default("openai/gpt-oss-120b"),
});

export const getServerEnv = () => {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: Server environment accessed from client browser!");
  }
  return serverEnvSchema.parse(process.env);
};
