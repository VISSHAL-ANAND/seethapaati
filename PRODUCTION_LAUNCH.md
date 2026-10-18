# 🚀 SEETHAPAATI — Production Launch & Go-Live Guide

Welcome to the production deployment guide for **Seethapaati**. This document provides the complete, step-by-step instructions for deploying the backend API and Next.js frontend to production with live Razorpay payments, Shiprocket courier tracking, Redis multi-layered caching, Google Rich Snippets SEO, and horizontal scaling for 5,000+ concurrent users.

---

## 📋 1. Exact List of Environment Variables

You only need to supply your live credentials into the environment configuration of your deployment platforms.

### 🌐 A. Frontend Web (`apps/web` or Vercel Environment Variables)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Live backend API URL including `/api/v1` | `https://api.seethapaati.com/api/v1` |
| `NEXT_PUBLIC_STORE_NAME` | Display name of the store | `SEETHAPAATI` |
| `NEXT_PUBLIC_SITE_URL` | Public production storefront URL | `https://seethapaati.com` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay Live Key ID | `rzp_live_xxxxxxxxxxxxxxxx` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification code (optional) | `google-site-verification-token` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Analytics toggle | `false` or `true` |

---

### ⚙️ B. Backend API (`apps/api` or Render / Server Environment Variables)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | HTTP port for NestJS API server | `3001` (or `10000` on Render) |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@host:5432/seethapaati?schema=public` |
| `REDIS_HOST` | Redis hostname | `seethapaati-redis` or `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (if required) | `""` or your redis password |
| `JWT_SECRET` | Secret key for JWT signing (**must be >= 32 chars in production**) | Generate via: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Auth token validity duration | `7d` |
| `CORS_ORIGIN` | Allowed web origins (comma-separated, no wildcards) | `https://seethapaati.com,https://www.seethapaati.com` |
| `RAZORPAY_KEY_ID` | Razorpay Live Key ID | `rzp_live_xxxxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Live Secret Key | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured on Razorpay Webhook Dashboard | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | Verified sender email address | `orders@seethapaati.com` |
| `SHIPROCKET_EMAIL` | Shiprocket account email (optional for courier automation) | `logistics@seethapaati.com` |
| `SHIPROCKET_PASSWORD` | Shiprocket account password | `YourPassword` |
| `SHIPROCKET_CHANNEL_ID` | Custom Shiprocket Channel ID (if configured) | `""` |
| `SHIPROCKET_WEBHOOK_TOKEN` | Shared secret token for Shiprocket tracking webhook | `your_tracking_secret` |
| `SELLER_LEGAL_NAME` | Legal registered entity name | `Seethapaati Foods Private Limited` |
| `SELLER_TRADE_NAME` | Brand trade name | `Seethapaati` |
| `SELLER_GSTIN` | 15-character statutory GSTIN number | `33ABCDE1234F1Z5` |
| `SELLER_STATE` | State of primary business location | `Tamil Nadu` |
| `SELLER_STATE_CODE` | 2-digit GST state code (must match first 2 digits of GSTIN) | `33` |
| `SELLER_PINCODE` | 6-digit postal code | `600004` |
| `ADMIN_INITIAL_PASSWORD` | Password for seeded `admin@seethapaati.com` account | `YourStrongAdminPassword2026!` |

---

## 🛠️ 2. Build and Start Commands

The repository is configured as an npm workspaces monorepo.

### 📦 Clean Installation & Compilation
```bash
# 1. Install all monorepo dependencies
npm install

# 2. Compile contracts, NestJS API, and Next.js frontend
npm run build
```

### 🗄️ Database Setup & Initial Seed
Run these against your production PostgreSQL database before launching traffic:
```bash
# 1. Run database migrations to create all tables
npm run db:migrate

# 2. Seed default roles, initial admin, categories, GST tax rates, and curated products
npm run db:seed
```

### 🚀 Production Start Commands
- **Backend API Server**:
  ```bash
  npm run start:api
  ```
  *(Runs `node dist/main` from `apps/api` listening on configured `PORT`)*

- **Frontend Storefront**:
  ```bash
  npm run start:web
  ```
  *(Runs Next.js production server from `apps/web`)*

---

## 🐳 3. Docker Containerization & Horizontal Scaling

For automated container deployment capable of handling 5,000+ concurrent users:

### Multi-Stage Dockerfiles:
- **`apps/api/Dockerfile`**: Optimized Node 20 Alpine image running NestJS with Prisma client and `/api/v1/health` healthchecks.
- **`apps/web/Dockerfile`**: Standalone Next.js Node 20 Alpine container with AVIF/WebP image optimization and immutable caching.

### Start Entire Production Cluster:
```bash
# Build and run Postgres, Redis, API (2 replicas), and Web (2 replicas)
docker compose -f docker-compose.prod.yml up -d --build
```

### Scale Services Horizontally:
```bash
# Scale API to 4 replicas and Web to 4 replicas
docker compose -f docker-compose.prod.yml up -d --scale api=4 --scale web=4
```

---

## 📦 4. Automated Courier & Order Tracking Setup

Seethapaati includes dual-mode shipping fulfillment:

### Mode 1: Automated Shiprocket Logistics
1. Supply `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` in your backend `.env`.
2. When a customer pays, `pushOrderToShiprocket()` creates the order and requests pickup.
3. In Shiprocket Dashboard -> **Settings** -> **Webhooks**, register:
   ```
   https://api.seethapaati.com/api/v1/webhooks/shipping
   ```
   Shiprocket will automatically push real-time checkpoints (`IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`).

### Mode 2: Manual Admin Tracking (Fallback)
If Shiprocket is not configured:
1. Log in to `/admin/orders`.
2. Select any `PAID` or `PACKED` order.
3. Enter the carrier name (e.g., Delhivery, Blue Dart, DTDC, India Post), AWB number, and Tracking URL.
4. Click **Dispatch & Mark Shipped**. The order flips to `SHIPPED`, records timestamps, and notifies the customer.
5. Customers can track their shipment at `/orders/[orderId]` with live progress checkpoints and direct courier links.

---

## 💳 5. Razorpay Live Webhook Setup Checklist

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Switch to **Live Mode** in the top navigation.
3. Go to **Account & Settings** → **Webhooks** → **Add New Webhook**.
4. In the **Webhook URL** field, enter:
   ```
   https://api.seethapaati.com/api/v1/webhooks/razorpay
   ```
   *(Replace `api.seethapaati.com` with your live backend API domain)*
5. In the **Secret** field, enter a secure random secret (or generate one) and paste that exact string into your backend `.env` as `RAZORPAY_WEBHOOK_SECRET`.
6. Under **Active Events**, select:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `payment.authorized`
7. Click **Create Webhook**.

---

## 🔍 6. Google Rich Snippets SEO & Structured Data

The storefront includes automated Google-compliant JSON-LD structured data:
- **Homepage (`/`)**: Injects `Organization` schema with logo, social links, and `WebSite` with `SearchAction` deep-linking.
- **Product Details (`/shop/[slug]`)**: Injects `Product`, `Offer` (price, INR currency, stock availability, seller info), `Brand`, and `BreadcrumbList`.
- **Sitemap & Robots**: Pre-configured `sitemap.ts` and `robots.ts` ensuring Googlebot indexes all active products immediately.

---

## 🌐 7. Custom Domain Configuration Checklist

### Domain Setup for Frontend (`seethapaati.com`):
1. In your Vercel or hosting project dashboard, go to **Settings** → **Domains**.
2. Add `seethapaati.com` and `www.seethapaati.com`.
3. In your DNS registrar (GoDaddy, Cloudflare, Namecheap), add the DNS records provided by Vercel:
   - **A Record**: `@` → `76.76.21.21`
   - **CNAME Record**: `www` → `cname.vercel-dns.com`
4. Wait for SSL certificate issuance (automatic via Let's Encrypt).

### Domain Setup for Backend API (`api.seethapaati.com`):
1. In your backend host (Render, Railway, or VPS), assign the custom domain `api.seethapaati.com`.
2. In your DNS registrar, add:
   - **CNAME Record**: `api` → pointing to your hosting provider's assigned address (e.g. `seethapaati-api.onrender.com`).
3. Ensure CORS on the backend allows `https://seethapaati.com` and `https://www.seethapaati.com`.

---

## 🔐 8. Default Administrative Access

After running `npm run db:seed`, your store has an administrator account ready:
- **Admin Portal URL**: `https://seethapaati.com/admin/login`
- **Email**: `admin@seethapaati.com`
- **Password**: Configured via `ADMIN_INITIAL_PASSWORD` (default: `Admin@Seethapaati2026`)

*Note: Immediately change the default admin password in production via the account settings.*

---

## ✅ 9. Verified Pre-Flight Checklist

- [x] Monorepo passes typecheck cleanly across all workspaces (`npm run typecheck`).
- [x] Production build passes cleanly with zero errors (`npm run build`).
- [x] All 19 backend test suites and 138 unit/integration tests pass.
- [x] Redis caching layer with `catalog:*` invalidation and rate-limiting guard configured.
- [x] Sub-second loading speed with Next.js ISR (`revalidate = 60`), AVIF/WebP image formats, and cache headers.
- [x] Google Rich Snippets JSON-LD structured data on Homepage and Product pages.
- [x] Multi-stage Dockerfiles and `docker-compose.prod.yml` ready for horizontal scaling (5,000+ users).
- [x] Dual-mode courier tracking (Shiprocket automated dispatch + manual admin fallback).
- [x] Razorpay client SDK and HMAC SHA256 timing-safe verification verified.
- [x] Full customer flows (Signup, Login, Shop, Cart, Checkout, Order Tracking) wired end-to-end.
- [x] Full admin operations (Order management, shipment tracking creation, product catalog editing) verified.
