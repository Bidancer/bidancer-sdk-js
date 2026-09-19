# bidancer

Official Bidancer SDK for JavaScript. Report influencer-campaign conversions (sign-ups, purchases, leads) from your server or your pages, and let Bidancer attribute them to the campaign that drove the click.

```bash
npm install bidancer   # or bun add bidancer
```

Zero dependencies. Node 18+, Bun, Deno, Cloudflare Workers, and browsers.

## Keys

Get keys from **Settings → Integrations** in your Bidancer workspace.

| Key | Where | Header |
| --- | --- | --- |
| `sk_…` secret | your server only | `Authorization: Bearer sk_…` |
| `pk_…` public | browser | `x-bidancer-key: pk_…` (page origin must be on your allow-list) |

Never ship a secret key to a browser. The server client refuses a `pk_` key.

## Server

```ts
import Bidancer from "bidancer";

const bidancer = new Bidancer(process.env.BIDANCER_SECRET_KEY);

const result = await bidancer.conversions.create({
    event: "purchase",          // signup | purchase | lead | custom event from the campaign terms
    externalRef: "ORD-10422",   // your id — repeats return the same row
    value: 1999,
    currency: "INR",
    clickId: req.body.bd_cid,   // optional: the click id your page captured
});
// { id, attributed, replayed, campaignId, reason? }
```

Options: `new Bidancer(key, { baseUrl, timeoutMs, fetch })`.

CommonJS: `const { Bidancer } = require("bidancer");`

Errors throw `BidancerError` with `status`, `code`, `message`, `details`. Network failures have `status: 0` and `code: "NETWORK" | "TIMEOUT"`.

## Browser: script tag

Add before `</body>` on every page the campaign links point at:

```html
<script src="https://cdn.jsdelivr.net/npm/bidancer/dist/bidancer-track.js" data-key="pk_live_…"></script>
```

It captures `?bd_cid=` from campaign links into `localStorage` and strips it from the URL. Then, when the visitor converts:

```js
window.bidancer("convert", { event: "signup", externalRef: "user_8f3a" });
```

Calls made before the script loads are queued if you add this stub in `<head>`:

```js
window.bidancer = window.bidancer || function () { (window.__bidancerQueue = window.__bidancerQueue || []).push(arguments); };
```

`window.bidancer("init", { key, endpoint })` sets the key at runtime instead of `data-key`.

## Browser: bundler (React, Vue, Angular, …)

```ts
import { bidancerBrowser } from "bidancer/browser";

const track = bidancerBrowser({ key: "pk_live_…" }); // captures bd_cid on creation
await track.convert({ event: "signup", externalRef: user.id });
```

Call `captureClickId()` yourself on route change if your router keeps the query string.

## Attribution rules

- A conversion is attributed when its click id falls inside the campaign's attribution window (default 30 days) and the event matches the campaign terms. Anything else is stored as unattributed (`attributed: false`, `reason`).
- Idempotent on `externalRef` per business. Send from the page and again from the server, or retry: same row, `replayed: true`.
- The browser snippet stops sending click ids older than 90 days.
- No cookies, no fingerprinting, no third-party requests.

## Other platforms

This repo is the JavaScript SDK. Android, iOS and Flutter SDKs are separate repos. A React Native package would live here under `packages/`.

## Contributing

```bash
bun install
bun test
bun run build        # packages/bidancer/dist
bun changeset        # describe your change; CI opens the release PR
```

Releases: merge to `main` → the Release workflow opens a "Version Packages" PR from pending changesets → merging it publishes to npm with provenance. Requires the `NPM_TOKEN` secret.
