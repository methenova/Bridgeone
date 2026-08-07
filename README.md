# BridgeOne Platform

BridgeOne is a live video commerce and customer support platform integrated with Supabase and WebRTC.

---

## Environment Setup

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

### Required Environment Variables

- `VITE_SUPABASE_URL`: Primary Supabase project API URL (`https://<project-ref>.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: Public Supabase client API key.

### High-Availability Regional Failover (Optional)

- `VITE_SUPABASE_BACKUP_URL`: Optional secondary regional database replica URL.
  - **Startup Behavior**: If `VITE_SUPABASE_BACKUP_URL` is omitted, the application issues an informational startup log and gracefully operates in **single-region mode** without runtime errors.
  - **Failover Trigger**: If primary database connectivity is lost, calling `triggerRegionalDbFailover()` automatically switches database client queries to the backup endpoint.

---

## Local Development Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Execute Vitest unit test suite
npm test
```
