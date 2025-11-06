import type { VercelRequest, VercelResponse } from "@vercel/node";
import { env, assertEnv } from "../config";
import { verifyShopifyWebhook, ShopifyOrderCancelled } from "../lib/shopify";
import { findUserByEmail, listUserEnrollments, unenrollEnrollment } from "../lib/learnworlds";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    assertEnv();
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }

  const verify = await verifyShopifyWebhook(req, env.SHOPIFY_WEBHOOK_SECRET);
  if (!verify.ok) {
    return res.status(401).json({ error: verify.reason || "Webhook verification failed" });
  }

  const topic = (req.headers["x-shopify-topic"] || "") as string;
  if (topic !== "orders/cancelled") {
    // Acknowledge other topics quickly
    return res.status(200).json({ ok: true, message: "Ignored non-cancelled topic" });
  }

  let order: ShopifyOrderCancelled;
  try {
    order = JSON.parse(verify.rawBody!.toString("utf8"));
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const email = order.email || order.customer?.email || null;
  if (!email) {
    return res.status(200).json({ ok: true, message: "No customer email on order" });
  }

  const skuToCourse = env.SKU_TO_COURSE_ID;
  const targetCourseIds = new Set<string>();
  for (const item of order.line_items || []) {
    const sku = item.sku || "";
    const courseId = skuToCourse[sku];
    if (courseId) targetCourseIds.add(courseId);
  }

  if (!targetCourseIds.size) {
    // Nothing mapped; acknowledge webhook
    return res.status(200).json({ ok: true, message: "No mapped SKUs to course IDs" });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(200).json({ ok: true, message: "User not found in LearnWorlds" });
    }

    const enrollments = await listUserEnrollments(user.id);
    const toUnenroll = enrollments.filter((e) => targetCourseIds.has(e.product_id));

    for (const enr of toUnenroll) {
      await unenrollEnrollment(enr.id);
    }

    return res.status(200).json({ ok: true, unenrolled_count: toUnenroll.length });
  } catch (err) {
    const message = (err as Error).message || String(err);
    return res.status(500).json({ error: message });
  }
}