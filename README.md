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

## Launch Inputs Still Needed

- Replace `public/manager.png` with an all-English manager screenshot before it
  is introduced into the marketing page.
- Provide the final production domain for `SITE_URL`.
- Provide a privacy policy before adding privacy claims to the homepage.
