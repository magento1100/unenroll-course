import crypto from "crypto";
import getRawBody from "raw-body";
import type { VercelRequest } from "@vercel/node";

export async function verifyShopifyWebhook(
  req: VercelRequest,
  secret: string
): Promise<{ ok: boolean; rawBody?: Buffer; reason?: string }> {
  try {
    const rawBody = await getRawBody(req);
    const hmacHeader = (req.headers["x-shopify-hmac-sha256"] || "") as string;
    if (!hmacHeader) return { ok: false, reason: "Missing HMAC header" };

    const digest = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    const safeCompare = crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(hmacHeader)
    );
    return safeCompare
      ? { ok: true, rawBody }
      : { ok: false, reason: "Invalid HMAC signature" };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }
}

export type ShopifyOrderCancelled = {
  id: number;
  email: string | null;
  customer?: { email?: string | null } | null;
  line_items: Array<{
    id: number;
    sku: string | null;
    title: string;
    quantity: number;
    variant_id: number | null;
    product_id: number | null;
  }>;
};