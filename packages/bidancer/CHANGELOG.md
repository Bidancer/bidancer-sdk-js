# bidancer

## 0.1.0

### Minor Changes

- 666a01f: Default `baseUrl` is now `https://api.bidancer.com/v1/influencer`, the dedicated developer API host. The previous default (`app.bidancer.com/api/influencer`) never resolved in production. Staging: pass `baseUrl: "https://dev-api.stg.bidancer.com/v1/influencer"` (or `data-endpoint` on the snippet).
- 002c4fd: First release: `Bidancer` server client (`conversions.create`), `bidancer/browser` factory, and the `bidancer-track.js` script-tag snippet.
