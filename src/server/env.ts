import { z } from "zod";
import { MONSTERS_CONTRACT } from "@/lib/constants";

const optionalUrl = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.url().optional(),
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(32).default("local-development-secret-change-me-now"),
  SIWE_DOMAIN: z.string().default("localhost:3000"),
  ETHEREUM_RPC_URL: optionalUrl,
  MONSTERS_CHAIN_ID: z.coerce.number().int().default(1),
  MONSTERS_CONTRACT_ADDRESS: z.string().default(MONSTERS_CONTRACT),
  OPENAI_API_KEY: z.string().optional(),
  IMAGE_PROVIDER: z.enum(["openai", "fake"]).default("fake"),
  ACTIVE_STYLE_SLUG: z.string().default("ember-archive"),
  GENERATION_ENABLED: z.stringbool().default(false),
  IMAGE_GENERATION_PAUSED: z.stringbool().default(false),
  GENERATION_DAILY_LIMIT: z.coerce.number().int().positive().default(10),
  GENERATION_WALLET_DAILY_LIMIT: z.coerce.number().int().positive().default(2),
  BUCKET_ENDPOINT: optionalUrl,
  BUCKET_REGION: z.string().default("auto"),
  BUCKET_NAME: z.string().optional(),
  BUCKET_ACCESS_KEY_ID: z.string().optional(),
  BUCKET_SECRET_ACCESS_KEY: z.string().optional(),
  IP_HASH_SECRET: z.string().min(32).default("local-development-ip-secret-change-me"),
  USE_DEMO_DATA: z.stringbool().default(true),
  WORKER_ONCE: z.stringbool().default(false),
});

let cached: z.infer<typeof schema> | undefined;

export function env() {
  cached ??= schema.parse(process.env);
  return cached;
}

export function assertProductionEnv() {
  const value = env();
  if (value.NODE_ENV !== "production") return value;
  const missing = [
    !value.DATABASE_URL && "DATABASE_URL",
    !value.ETHEREUM_RPC_URL && "ETHEREUM_RPC_URL",
    !value.BUCKET_ENDPOINT && "BUCKET_ENDPOINT",
    !value.BUCKET_NAME && "BUCKET_NAME",
    value.IMAGE_PROVIDER === "openai" && !value.OPENAI_API_KEY && "OPENAI_API_KEY",
  ].filter(Boolean);
  if (missing.length) throw new Error(`Missing production environment: ${missing.join(", ")}`);
  return value;
}
