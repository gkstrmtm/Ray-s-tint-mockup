# Ray’s Tint Mockup

This is a static HTML/CSS/JS mockup (no backend).

## Deploy on Vercel (no domain needed)

Vercel always provides a free shareable URL like:

- `https://<project-name>.vercel.app`

You **do not need a custom domain** to share the preview.

### Option A - Vercel Dashboard (recommended)

1. Go to Vercel → **Add New… → Project**
2. Import this repo: `gkstrmtm/Ray-s-tint-mockup`
3. Framework preset: **Other** (static)
4. Deploy

Vercel will auto-detect `index.html`.

### Option B - Vercel CLI (local deploy)

From the repo folder:

```powershell
npm i -g vercel
vercel login
vercel
```

Then to push a production deployment:

```powershell
vercel --prod
```

## Notes

- `assets/` contains gallery photos.
- `brand/` contains the logo used in the header.
- The gallery pop-up/modal is intentionally disabled for this soft mockup.
- The `⋮` button in the sticky bottom bar opens local-only admin controls for thumbnail framing.
