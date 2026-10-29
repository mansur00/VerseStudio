# HTTPS Deployment Requirements for Mobile Camera Pairing

## WebRTC Mobile Streaming Security Architecture

VerseStudio includes mobile camera pairing functionality (Screens 14-17), enabling users to connect their smartphone's camera over local Wi-Fi / WebRTC as a live 1080p 30 FPS camera source in the studio recording.

### Browser Security Constraint: `getUserMedia` Requires HTTPS
Under W3C and modern browser security standards (enforced by Apple Safari on iOS and Google Chrome on Android):
1. **Insecure Origins Blocked**: Web browsers strictly disallow camera and microphone access (`navigator.mediaDevices.getUserMedia`) over unencrypted HTTP connections.
2. **Exception for Localhost Only**: `http://localhost` and `http://127.0.0.1` are permitted by browsers *only* when accessed directly on the local machine loopback interface. A smartphone connecting across a local LAN (e.g. `http://192.168.1.50:3000`) is treated as an untrusted insecure origin, and `getUserMedia` immediately throws a `NotAllowedError` or `SecurityError`.
3. **Production Requirement**: For mobile camera pairing to work on smartphones, the web app (`apps/web`) **must be served over HTTPS** with a valid TLS certificate.

---

## Environment Variables Configuration

Configure the following environment variables in your deployment environment:

| Variable | Description | Example (Production) | Example (Dev / Tunnel) |
|---|---|---|---|
| `WEB_BASE_URL` | Base URL of the deployed Next.js web application | `https://app.versestudio.com` | `https://tunnel.ngrok.app` |
| `API_BASE_URL` | Base URL of the API server (can match `WEB_BASE_URL`) | `https://api.versestudio.com` | `https://tunnel.ngrok.app` |
| `VITE_WEB_BASE_URL` | Build-time extension override for web app URL | `https://app.versestudio.com` | `https://tunnel.ngrok.app` |
| `VITE_API_BASE_URL` | Build-time extension override for API server URL | `https://api.versestudio.com` | `https://tunnel.ngrok.app` |
| `STRICT_PROD_CHECK` | Enforces HTTPS and blocks `localhost` at build time | `true` | `false` |

---

## Local Development with a Real Phone

If you wish to test mobile camera streaming from a physical iPhone or Android phone during development:
1. **Option A: HTTPS Reverse Proxy (Recommended)**
   Run a tunnel like Cloudflare Tunnels or ngrok:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   # or
   ngrok http 3000
   ```
2. **Option B: Local TLS with mkcert**
   Generate trusted local development certificates using `mkcert` and configure Next.js / local proxy to serve HTTPS on your LAN IP.
3. Set `VITE_WEB_BASE_URL` and `VITE_API_BASE_URL` to your HTTPS tunnel URL when building the extension:
   ```bash
   VITE_WEB_BASE_URL=https://your-tunnel.ngrok.app VITE_API_BASE_URL=https://your-tunnel.ngrok.app pnpm --filter @verse-studio/extension build
   ```

