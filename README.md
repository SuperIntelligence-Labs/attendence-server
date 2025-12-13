# Cloudflare Worker + Hono + Bun Template

This template helps you quickly set up a Cloudflare Worker using **Hono** with **Bun** as the runtime.

---

## 📦 Installation

```sh
bun install
```

---

## 🚀 Development

Run the development server locally (with hot reload):

```sh
bun run dev
```

This uses **Wrangler's** local dev mode so you can test your Worker before deploying.

---

## 📤 Deployment

Before deploying, you need to set up your **Cloudflare API Token** so Wrangler can authenticate.

---

### 1️⃣ Get a Cloudflare API Token

1. Go to your [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens).
2. Click **Create Token**.
3. Choose the **"Edit Cloudflare Workers"** template or create a custom token with:

    * **Permissions:**

        * **Account → Cloudflare Workers → Edit**
        * **Zone → Workers Routes → Edit** (optional, if deploying to routes)
    * **Account Resources:** Include your account
4. Create and **copy** your API token.

---

### 2️⃣ Export the API Token to Wrangler

Wrangler will look for the `CLOUDFLARE_API_TOKEN` environment variable.

**Linux / macOS:**

```sh
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

**Windows (PowerShell):**

```powershell
$env:CLOUDFLARE_API_TOKEN="your-api-token-here"
```

Or authenticate directly:

```sh
wrangler login
```

This will open a browser window to log in to Cloudflare.

---

### 3️⃣ Deploy to Cloudflare

```sh
bun run deploy
```

---

## 🔄 Generate Cloudflare Types

To synchronize type definitions for Cloudflare bindings:

```sh
bun run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating **Hono**:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

---

## 📚 Useful Links

* [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
* [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
* [Hono Docs](https://hono.dev/)
