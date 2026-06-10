# Developer Docs Progress Tracker Website

English marketing homepage for the Developer Docs Progress Tracker browser extension.
The v1 site is built with Next.js App Router and exported as static files.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. Development preview uses that
local URL automatically when `SITE_URL` is not configured.

If port `3000` is unavailable, start on an explicit port and align local
metadata with it:

```bash
SITE_URL=http://localhost:3001 npm run dev -- --port 3001
```

## Verification

```bash
npm test
npm run typecheck
npm run lint
SITE_URL=https://your-domain.example npm run build
```

`SITE_URL` is required for production builds so canonical URLs, social metadata,
`robots.txt`, and `sitemap.xml` identify the deployed website correctly. Set it
to the final HTTPS domain before publishing; it is not required for local
development.

## Analytics And Search

Google Analytics is enabled only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set to
a GA4 web stream Measurement ID such as `G-XXXXXXXXXX`. Leave it unset for local
development or builds that should not send traffic data.

The site generates `/robots.txt` and `/sitemap.xml` from `SITE_URL` during the
production build. After deployment, submit `https://your-domain.example/sitemap.xml`
in Google Search Console. The existing Google verification meta tag is already
included in page metadata, so no verification file is required unless Search
Console asks for a different verification method.

## Email Auth

Account registration and password login use Supabase Auth. Configure these
values in your local and production environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

In the Supabase dashboard, enable the Email provider, require email confirmation,
set the production Site URL, and add redirect URLs for
`http://localhost:3000/auth/confirm` and `https://your-domain.example/auth/confirm`.

Apply `docs/supabase/user-permissions.sql` in the Supabase SQL editor to create
per-user permission grants for account features. The script installs a signup
trigger for future accounts created before `2028-01-01T00:00:00Z` and backfills
`canSync` and `canPullServerData` grants for accounts created before
`2028-01-01T00:00:00Z`, with each grant expiring three months after the account
creation time.

Apply `docs/supabase/user-profiles.sql` to create account profiles. New auth
users receive a random 8-character nickname and a generated circular avatar based
on their email initial; existing auth users are backfilled by the same script.
Account deletion uses Supabase Auth admin APIs, so server environments must also
set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

External clients can create a local account session with `POST /api/auth/login`.
Send JSON `{ "email": "reader@example.com", "password": "password123" }`. A
successful response includes `accessToken`, `user.id`, `user.email`, optional
`user.name`, and boolean `permissions.canSync` / `permissions.canPullServerData`.
Future authenticated APIs should receive that token as
`Authorization: Bearer <accessToken>`.

Clients can refresh the stored permission state with `GET /api/me/permissions`
and the same bearer token. A successful response includes boolean
`permissions.canSync` / `permissions.canPullServerData` and may include updated
`user` details. Missing or invalid tokens return `401 Unauthorized`.

## Launch Inputs Still Needed

- Replace `public/manager.png` with an all-English manager screenshot before it
  is introduced into the marketing page.
- Provide the final production domain for `SITE_URL`.
- Provide a privacy policy before adding privacy claims to the homepage.
