export type Env = {
  SHOPIFY_WEBHOOK_SECRET: string;
  LEARNWORLDS_API_BASE: string;
  LEARNWORLDS_API_TOKEN: string;
  SKU_TO_COURSE_ID: Record<string, string>;
};

function parseJsonEnv<T>(name: string, fallback: T): T {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const env: Env = {
  SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET || "",
  LEARNWORLDS_API_BASE: process.env.LEARNWORLDS_API_BASE || "",
  LEARNWORLDS_API_TOKEN: process.env.LEARNWORLDS_API_TOKEN || "",
  SKU_TO_COURSE_ID: parseJsonEnv<Record<string, string>>("SKU_TO_COURSE_ID", {}),
};

export function assertEnv() {
  const missing: string[] = [];
  if (!env.SHOPIFY_WEBHOOK_SECRET) missing.push("SHOPIFY_WEBHOOK_SECRET");
  if (!env.LEARNWORLDS_API_BASE) missing.push("LEARNWORLDS_API_BASE");
  if (!env.LEARNWORLDS_API_TOKEN) missing.push("LEARNWORLDS_API_TOKEN");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}