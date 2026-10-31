import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    ANTHROPIC_API_KEY: v.string(),
    GOOGLE_GENERATIVE_AI_API_KEY: v.string(),
    CLERK_JWT_ISSUER_DOMAIN: v.string(),
  },
});

export default app;
