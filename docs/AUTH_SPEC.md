# Authentication Architecture & Security Specification

## 1. Architectural Decision: Custom Cryptographic Auth Engine vs Supabase Auth

### Decision Summary
VerseStudio implements a **unified, self-contained server-side cryptographic authentication engine** (`apps/web/src/lib/userAuthService.ts`) with seamless Postgres compatibility, for the following technical and architectural reasons:

1. **Manifest V3 Extension Interoperability**:
   Standard Supabase client SDKs depend on local cookies, full DOM windows, or redirects that conflict with MV3 Chrome Extension security boundaries (specifically background service worker sleep cycles and strict cross-origin restrictions). Our unified server API endpoints (`/api/auth/*`) communicate transparently with the Chrome extension via standard Bearer tokens (`chrome.storage.local`), Next.js SSR pages, and mobile WebRTC clients alike.
2. **Strict Drive Privacy Boundaries**:
   VerseStudio's core promise is that files reside exclusively in the user's personal Google Drive. By implementing a direct auth pipeline, account deletion (`/api/auth/delete-account`) cleanses platform profiles, audit records, and server sessions while guaranteeing that Google Drive files and Google OAuth tokens remain untouched.
3. **Database Independence**:
   The engine reads and writes to PostgreSQL / Supabase Postgres schema (`profiles`, `sessions`, `verification_codes`, `password_reset_tokens`) while remaining independently testable in isolated CI environments (e.g. `@electric-sql/pglite` or local Postgres) with zero mock fallbacks.

---

## 2. Password Hashing Specification

To meet OWASP 2023/2024 Password Storage Guidelines:
- **Algorithm**: `PBKDF2-HMAC-SHA256`
- **Iterations**: **600,000 rounds** (strictly enforces `>= 600,000` iterations to withstand modern GPU-accelerated brute-force attacks)
- **Salt**: 128-bit cryptographically secure pseudorandom salt (`crypto.randomBytes(16).toString('hex')`) generated per user
- **Key Length**: 64 bytes (512 bits) output key length
- **Verification**: Constant-time comparison preventing timing analysis side-channels

```typescript
// apps/web/src/lib/userAuthService.ts
public hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha256').toString('hex');
}
```

---

## 3. Rate Limiting & Brute-Force Protection

Rate limiting is enforced across all public authentication endpoints:

| Endpoint | Window | Limit | Action on Violation |
|---|---|---|---|
| `/api/auth/signup` | 60s | 10 requests / IP | HTTP 429 Too Many Requests |
| `/api/auth/signin` | 60s | 10 requests / IP | HTTP 429 & session lock |
| `/api/auth/verify-email` | 15 min | 5 failed attempts / code | Code immediately revoked |
| `/api/auth/forgot-password` | 60s | 5 requests / IP | HTTP 429 Too Many Requests |
| `/api/signaling` | 60s | 60 requests / code | HTTP 429 Rate limited |

---

## 4. Email Delivery of OTP & Password Reset Links

Transactional email dispatch is handled by `apps/web/src/lib/emailService.ts`:
- **Configurable Provider**:
  - In production: **Resend API** via `RESEND_API_KEY` and `EMAIL_FROM`.
  - In custom deployments: Standard SMTP via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.
  - In CI/Dev: Secure dispatch audit log (`EmailService.auditDispatchedEmails`) verifying recipient, subject, code, and timestamp.
- **Verification OTP**: 6-digit numeric token generated via `crypto.randomInt(100000, 999999)` with a 15-minute TTL.
- **Password Reset**: 256-bit single-use cryptographic token (`crypto.randomBytes(32).toString('hex')`) with a 60-minute TTL.

