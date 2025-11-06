# Shopify → LearnWorlds Unenroll App

Serverless webhook that listens to Shopify `orders/cancelled` events and unenrolls matching courses in LearnWorlds, deployable on Vercel.

## How it works
- Verifies Shopify webhook HMAC using `SHOPIFY_WEBHOOK_SECRET`.
- Extracts customer email and order line item `sku` values.
- Maps SKUs to LearnWorlds product/course IDs via `SKU_TO_COURSE_ID` (JSON env).
- Looks up the LearnWorlds user by email and lists their enrollments.
- Unenrolls any enrollment whose `product_id` matches the mapped course IDs.

## Setup
1. Clone this repo and push it to your Git provider (GitHub/GitLab/Bitbucket).
2. Create a new Vercel project and import this repository.
3. In Vercel Project Settings → Environment Variables, set:
   - `SHOPIFY_WEBHOOK_SECRET`
   - `LEARNWORLDS_API_BASE` (e.g. `https://your-school.learnworlds.com/api/v2`)
   - `LEARNWORLDS_API_TOKEN` (access token from LearnWorlds Developer settings)
   - `SKU_TO_COURSE_ID` (JSON; e.g. `{"COURSE-101":"course_abc123"}`)
4. Deploy on Vercel. Note your production domain.
5. In Shopify Admin → Settings → Notifications → Webhooks, add:
   - Event: `Order cancellation`
   - URL: `https://YOUR-VERCEL-DOMAIN/api/shopify-webhook`
   - Secret: same as `SHOPIFY_WEBHOOK_SECRET`

## Notes
- Endpoints used for LearnWorlds are based on API v2 patterns. If your school uses different endpoint shapes, adjust functions in `lib/learnworlds.ts` accordingly.
- Mapping uses Shopify `line_items[].sku`. Ensure your products/variants have SKUs aligned with your LearnWorlds product IDs mapping.
- This function is idempotent per enrollment delete. Shopify may retry webhooks; deletes on non-existing enrollments will simply no-op.

## Local development
- Install dependencies: `npm install`
- You can run `vercel dev` if you have Vercel CLI installed.
- Configure a tunnel or forwarder for Shopify webhooks, or test by posting sample payloads to `http://localhost:3000/api/shopify-webhook`.