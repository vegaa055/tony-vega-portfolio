# Portfolio rebuild plan

A ground-up rebuild of Tony Vega's portfolio: blog, projects with a page each, an
editable About page, and a private admin panel to manage all of it. Deploys to
Vercel.

Approved 2026-09-14. Each phase ends with something runnable that gets reviewed
before the next phase starts.

## Decisions

| Area | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16.3 (App Router, TypeScript) | Current stable. Must stay on 16.3.3 or newer (August 2026 security release). |
| Rendering | Server-rendered with Cache Components (`use cache`) | Visitors get cached pages; admin saves refresh only the affected pages through cache tags. Keeps the database asleep most of the time. |
| Styling | Tailwind CSS 4.3 | Current stable. Design tokens live in `src/app/globals.css`. |
| Database | Postgres: Docker locally, Neon in production | Content is small and relational. Neon's free tier scales to zero and wakes on demand; Supabase's free tier pauses after a week of inactivity. |
| Database code | Drizzle ORM 0.45 | Schema in TypeScript, no code generation, light on serverless. (1.0 is still a release candidate.) |
| Admin login | Better Auth | Auth.js is in maintenance mode; Better Auth is its successor (and now part of Vercel). |
| Images | Vercel Blob | Built into Vercel. |
| Writing format | Markdown with live preview | Portable and easy to back up. |
| Admin approach | Custom-built | Three content types don't need a full CMS, and the admin itself is portfolio work. |
| Hero | Three.js nebula (WebGL 2) | Reacts to the cursor like gas being passed through. Loads after the page is up, with a CSS stand-in for everyone else. |
| Look | "Cosmic dark" | Deep-space neutrals, one warm accent, Martian Mono + Instrument Sans. Michroma for the home page heading and for project and post titles wherever they appear, including share cards (`src/lib/fonts.ts`). |
| Name | Tony Vega | At www.tonyvega.io; `NEXT_PUBLIC_SITE_URL` sets the address. |
| Older projects | Imported as hidden drafts | 7 from the Flask portfolio + 3 games from the static site. |

## Content model

Defined in `src/db/schema.ts`.

- **Project**: title, slug, tagline, summary, body (Markdown), cover image, gallery, tech stack, tags, repo/live links, featured flag, display order, draft or published
- **Post**: title, slug, excerpt, body (Markdown), cover image, tags, draft or published, publish date (reading time is computed, not stored)
- **Tag**: shared by posts and projects through `post_tags` and `project_tags`
- **About page**: a single row with headline, bio (Markdown), portrait, skill groups, experience entries
- **Admin account**: Better Auth's tables for the user, sessions, two-factor secrets, and login rate limits, in `src/db/auth-schema.ts`

## Phases

### Phase 1: Foundation ✅

- [x] Git repo, Next.js 16.3.5 + Tailwind 4.3 + TypeScript
- [x] Cache Components and typed routes enabled
- [x] Design tokens, fonts, page shell (header, nav, footer, starfield backdrop)
- [x] Hero slot with a CSS-only orrery placeholder
- [x] Local Postgres in Docker, Drizzle schema, first migration
- [x] Home, Projects, Blog, About, and 404 pages with empty states
- [x] Lint, type check, and production build pass

### Phase 2: Public site ✅

- [x] Markdown rendering: sanitized HTML, Shiki code highlighting (custom theme), linkable headings, image figures, tables
- [x] Data layer: cached reads (`use cache` + `cacheLife("max")` + tags from `src/lib/cache-tags.ts`)
- [x] Home: featured projects and latest posts
- [x] Projects index with a tag filter kept in the URL (`?tag=audio`), and a page per project with specs, contents, gallery, and previous/next links
- [x] Blog index and post pages
- [x] About page from the database: bio, portrait, skills, experience timeline
- [x] Seed script (`npm run db:seed`): 4 featured projects, 10 older projects as drafts, About content, 1 published post and 1 draft
- [x] Drafts and unknown slugs show the not-found page (a noindex "soft 404" in production; see notes); production build works with an empty database and a seeded one

### Phase 3: Admin panel ✅

- [x] Better Auth: email + password, sign-ups disabled, account created by script (`admin:create`, recovery with `admin:reset`), login rate-limited
- [x] Optional two-factor login (authenticator app) with backup codes, and password change, on a Security page
- [x] Dashboard listing posts and projects with status, and project display order
- [x] Post and project editors: Markdown toolbar and live preview, images by button, paste, or drag-and-drop (a local folder in development, Vercel Blob in production), gallery, tags, publish/unpublish with dates, delete with confirmation, unsaved-changes warning
- [x] About page editor
- [x] Every admin page and Server Action re-checks the session and validates input
- [x] Tested in the browser: create, edit, publish, uploads, gallery, validation, delete, and saving while signed out or offline

### Phase 4: Polish and quality

- [x] Tests: Vitest unit tests (`npm test`), Playwright end-to-end tests against a production build with its own database (`npm run test:e2e`), and a GitHub Actions workflow that runs both
- [x] Design pass and mobile layouts: text at least 12px on phones, tap targets at least 24px, lighter faint text and stronger field borders for contrast, the admin usable at 320px, no sideways scrolling at tablet and laptop widths, a public error page, Apple icon and web manifest
- [x] SEO: canonical addresses, Open Graph and X (Twitter) tags, a generated share image for every public page, sitemap, robots.txt, an RSS feed at `/feed.xml`, and structured data (JSON-LD)
- [x] Accessibility: axe checks (WCAG 2.2 A and AA rules) on public and admin pages at desktop and phone widths, and keyboard walk-throughs. Fixed along the way: a 2px focus ring on admin fields, and focused elements no longer scroll behind the sticky header or save bar
- [x] Lighthouse (mobile) scores recorded below. Fixed from its findings: comparison tables written with an empty top-left cell now mark their first column as row headers

**Lighthouse scores** (Lighthouse 13.4.1, mobile: an emulated phone on simulated slow 4G, against the production build on the development machine, 2026-09-15, median of three runs):

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Home | 94 | 100 | 100 | 100 |
| Project (3D Solar System) | 94 | 100 | 100 | 100 |
| Post (Rebuilding my portfolio) | 100 | 100 | 100 | 100 |

Performance swung between runs (81 to 99 on the home page) because the machine was busy. The weakest number was the project page's Largest Contentful Paint (its title) at 2.3 to 3.0s in Lighthouse's slow-4G simulation; on the live site it's 1.6 to 2.3s (see Phase 5).

### Phase 5: Deploy to Vercel

Live since 2026-09-16 at https://www.tonyvega.io. The first address, https://tony-vega-portfolio.vercel.app, redirects there.

- [x] **Tony:** GitHub repo, Vercel project, Neon and Blob connected from the Vercel dashboard
- [x] Migrations run on every deploy (`vercel-build`); production seeded; production admin account created
- [x] Security headers on every response: Content-Security-Policy, HSTS, nosniff, Referrer-Policy, framing protection, Permissions-Policy, and a same-origin opener policy
- [x] Smoke test of the live site: pages, headers, robots, sitemap, feed, share cards, the admin locked, and drafts hidden (25 checks, all passing)
- [x] **Tony:** saved an edit with an uploaded image on the live site (Blob with OIDC; see notes)
- [ ] **Tony:** turn on two-factor login on the live site
- [x] **Tony:** custom domain tonyvega.io, with `www.tonyvega.io` as the main address and `NEXT_PUBLIC_SITE_URL` pointing to it

**Lighthouse on the live site** (same settings as Phase 4, 2026-09-16, median of three runs):

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Home | 88 | 100 | 100 | 100 |
| Project (3D Solar System) | 99 | 100 | 100 | 100 |
| Post (Rebuilding my portfolio) | 97 | 100 | 100 | 100 |

Largest Contentful Paint is 1.6 to 2.3s on all three pages (under 2.5s counts as good). The home page scores lower (72 to 90) only on Speed Index and main-thread time: the orrery placeholder never stops moving, so Lighthouse can't call the page visually finished, and its 3D transforms keep the test browser busy. See the note under "Later: 3D hero".

### Hero nebula

Built on the `hero-nebula` branch and merged on 2026-09-17. The whole hero band is a
Three.js (WebGL 2) nebula in the site's colors: periwinkle gas around a coral
core. A small fluid simulation on the GPU carries the clouds, so the cursor
parts them and leaves a wake that swirls and settles over a few seconds. On
touch screens, and whenever the mouse rests for five seconds, an unseen
drifter crosses the gas every 13 seconds instead.

The code is in `src/components/hero/`: `hero-nebula.tsx` decides when to load
it, and `nebula/` holds the scene, the simulation, and the shaders.

- [x] Three.js loads only on the home page, and only after the page is up: on
      the first interaction, or three seconds after loading. A CSS stand-in in
      the same colors shows until then.
- [x] The stand-in stays for browsers without WebGL 2 or float render targets,
      for GPUs that draw on the CPU (SwiftShader, llvmpipe, Microsoft Basic
      Render Driver), and for visitors asking to save data.
- [x] Reduced motion gets a still frame, and switches over live if the setting
      changes.
- [x] Pauses off screen and in hidden tabs. Touch devices draw at 30 frames a
      second; fast displays are held to 60. Quality (canvas size, simulation
      grid, pressure passes) steps down after 90 slow frames and never climbs
      back, so the picture can't flicker between levels.
- [x] The push is measured against time, not frames, so the wake looks the
      same at 30, 60, or 144 frames a second, and gas near the body is carried
      toward its speed rather than shoved harder every frame.
- [x] Text contrast over the nebula, measured from screenshots at seven widths
      from 360 to 1920px, still and right after stirring the gas behind the
      text: everything passes, the intro paragraph at 8.6:1.
- [x] 38 unit tests for the logic that needs no GPU, and 7 end-to-end tests
      (starting, pausing, reduced motion, both fallbacks, links, restart).
- [x] Merged to `main` and deployed; the live site passes its 25 smoke checks.
- [ ] **Tony:** try it on a phone and a laptop, and say if the wake, the
      colors, or the core's brightness want tuning.

**Lighthouse, local production builds, real GPU, median of three runs:**

| Build | Phone | Desktop | LCP (desktop) | Total Blocking Time |
| --- | --- | --- | --- | --- |
| `main` | 93 | 93 | 2.1s | 48ms / 36ms |
| `hero-nebula` | 93 | 93 | 2.0s | 49ms / 53ms |

The scores don't move because Lighthouse never interacts and finishes before
the three-second timer: it measures the CSS stand-in. The nebula's real cost
is a 134 KB (gzipped) chunk for Three.js and the scene, fetched after the page
is interactive, and about 0.3ms of main-thread work per frame on a desktop GPU.

Where to tune it:

- **How the gas behaves:** the constants at the top of `nebula/fluid.ts` (how
  much speed the gas takes from the body, how fast it slows, swirl, and how
  quickly clouds settle back).
- **Colors and composition:** `COMPOSITE` in `nebula/shaders.ts`; the clouds
  themselves are drawn once by `CLOUDS`, which tiles so they can drift forever.
- **Layout:** `hero-nebula.module.css` owns `--core-x`, `--core-y` and
  `--core-size` (where the core glows, per breakpoint), and the scene reads
  the same values, so the CSS stand-in and the nebula always agree.
- **When it loads:** `START_AFTER_MS` and the trigger events in
  `hero-nebula.tsx`. Loading sooner would put Three.js inside Lighthouse's
  measured window.

End-to-end tests run in browsers that draw WebGL on the CPU, which the nebula
normally declines; they set `window.__nebulaAllowSoftware` to let it run there.

## Notes for later phases

Things discovered along the way that will matter later.

- **Caching:** the footer's `cacheLife("days")` caps every page's revalidation
  at one day. That's intended (a daily safety refresh). Admin saves must still
  revalidate the matching tags in `src/lib/cache-tags.ts` so edits show up
  immediately: a project save revalidates `projects` and `project:<slug>`.
- **Slugs:** `src/lib/static-params.ts` prerenders the slug `_none` when
  nothing is published (Cache Components fails the build on an empty
  `generateStaticParams`). Slug validation uses `SLUG_PATTERN` from
  `src/lib/slug.ts`, which can never produce that placeholder.
- **Dates:** project cards show the year of `publishedAt`. When publishing an
  older draft (e.g. Space Force), set its publish date in the editor first.
- **Detail pages and 404s:** `/projects/[slug]` and `/blog/[slug]` look up
  content before rendering, so drafts and unknown slugs show the not-found page
  and nothing of the draft. In production, only published slugs are
  prerendered; any other slug has already started streaming, so the status is
  200 with a `noindex` tag (a "soft 404"), which the end-to-end tests check.
  Other unknown addresses get a real 404. A true 404 there would need a
  database lookup in `proxy.ts` before every request, which isn't worth it for
  drafts nobody links to. The pages export `instant = false`; if navigation
  ever feels slow, add `prefetch` to the card links.
- **Class name collisions:** Shiki adds its theme name as a class on every code
  block (`deep-field-code`). An earlier theme name matched the starfield's class
  and broke code blocks, so keep site classes and Markdown output distinct.
- **Seed script:** it has its own Drizzle client because `src/db/index.ts`
  imports `server-only`, which throws outside Next.js. It never overwrites
  existing rows unless run with `--force`.
- **Dev image optimizer:** if a cover image never loads in `next dev` after
  navigating away mid-load, restart the dev server. It's a dev-only stuck
  request on a slow disk; production uses Vercel's image optimization.
- **Auth checks:** there's no `proxy.ts`. The admin layout, every admin page,
  every Server Action, and both upload routes check the session themselves.
  (A proxy file can also cause `usePathname()` hydration mismatches on
  prerendered pages.) Editor actions (save, preview) return a "signed out"
  result instead of redirecting, so unsaved work is never navigated away from.
- **Rate limiting** only applies to HTTP requests to `/api/auth`, so login and
  two-factor go through the browser auth client, never Server Actions.
- **Auth schema:** `src/db/auth-schema.ts` is generated by the Better Auth CLI
  and then edited so timestamps store a time zone. Re-apply that edit after
  regenerating (the file header has the command).
- **Kept-mounted pages:** Next.js 16 keeps the last 3 visited pages mounted but
  hidden, with their state. So editors reset on link navigation
  (`ResetOnNavigation`, keyed on `bfcacheId`) but restore on Back/Forward, use
  `fieldId()` for unique element ids, and a new item's first save redirects to
  its edit page. Forms holding passwords or two-factor secrets clear themselves
  when hidden, and signing out does a full page load. New admin forms should
  follow the same patterns.
- **Instant navigation warnings:** the admin layouts and pages export
  `instant = false`. `(panel)/loading.tsx` still shows while an admin page
  loads, but the dev-time check doesn't count it.
- **End-to-end tests:** `npm run test:e2e` recreates a `portfolio_test`
  database on the local Postgres (it refuses any database whose name doesn't
  end in `_test`), builds into `.next-e2e`, and serves on port 3100, so it never
  touches your content or your dev build. Because Next.js keeps recently
  visited pages in the document (hidden), tests find form fields with the
  visibility-aware `field()` helper in `e2e/helpers.ts`. Tests that sign in
  send their own IP address, since login is rate limited per address.
- **Uploads outlive content:** deleting a post or project leaves its images in
  storage (the delete dialog says so). A cleanup tool could come later.
- **Metadata merging:** when a page sets `openGraph` or `alternates`, Next.js
  replaces the layout's values instead of merging them. Public pages build
  their metadata with `pageMetadata()` in `src/lib/metadata.ts`, so each one
  gets the full set: canonical address, feed link, and site name.
- **Share images:** each public page has an `opengraph-image.tsx` beside it.
  The home page's lives in `(site)/`, because a page that sets `openGraph`
  loses a share image inherited from a parent folder. Files inside route groups
  get a hash in their address (`/opengraph-image-12o0cb`). Cards are drawn by
  `src/lib/og/card.tsx` inside `use cache`, so they're built with the pages and
  refreshed by the same cache tags when content is saved. The renderer only
  lays out with flexbox, needs WOFF or TTF fonts (in `assets/fonts`, under the
  SIL Open Font License), can't draw WebP or AVIF (sharp converts covers), and
  only clamps lines on `display: block` elements.
- **Build tracing:** a file path built from a variable, like the local upload
  folder, makes Turbopack ship the whole project with the server code. Those
  paths carry a `/* turbopackIgnore: true */` comment. Watch the build output
  for "Dynamic filesystem access" warnings.
- **Sitemap and feed:** built with the site and refreshed through the `posts`
  and `projects` cache tags. The end-to-end tests check that a newly published
  post appears in both. `robots.ts` blocks all crawling on Vercel preview
  deployments.
- **Focus and sticky bars:** `scroll-padding` on `html` (in `globals.css`)
  keeps focused elements from scrolling behind the sticky header, and behind
  the editors' save bar (marked `data-save-bar`). Anything else made sticky
  needs the same treatment.
- **Login rate limit and IP addresses:** Better Auth only trusts
  `x-forwarded-for` when it holds a single address. Vercel sets that header
  itself, so the limit works there. A self-hosted `next start` with nothing in
  front would let clients pick their own address and dodge the limit, so run
  production on Vercel, or behind a proxy that overwrites the header.
- **Node.js 24:** required by `package.json` (`engines`). CI and Vercel read
  the version from there.
- **Neon on Vercel:** connect the database with no custom prefix. With one
  (the first attempt got `STORAGE_`), the variables become
  `STORAGE_DATABASE_URL` and so on, and the build can't find the database.
  Don't add `DATABASE_URL` or `DATABASE_URL_UNPOOLED` by hand; the connection
  manages both (pooled for the app, direct for migrations). Cache Components
  requires the Node.js runtime, so no route may use the Edge runtime.
- **Auth settings on Vercel:** `BETTER_AUTH_SECRET` is a Secret for Production
  and Preview; only Vercel knows it, and the admin scripts don't need it
  (passwords are hashed without it). `NEXT_PUBLIC_SITE_URL` is a Config
  variable for Production only. Preview deployments fall back to their own
  address (`NEXT_PUBLIC_VERCEL_BRANCH_URL`, which needs Vercel's
  "Automatically expose System Environment Variables", on by default) and are
  trusted through `VERCEL_URL` and `VERCEL_BRANCH_URL`.
- **Custom domain:** `www.tonyvega.io` is the main address. `tonyvega.io` and
  `tony-vega-portfolio.vercel.app` redirect to it (Domains settings). The
  login only accepts requests from `NEXT_PUBLIC_SITE_URL` (and preview
  deployments' own addresses), so any other address that serves production
  must redirect rather than serve the site. The domain was bought at
  Hostinger but uses Vercel's nameservers, so DNS records are edited in
  Vercel; there are no email (MX) records yet. Share cards print the address
  without `www.`.
- **Running the admin scripts against production:** set
  `DATABASE_URL_UNPOOLED` to Neon's direct connection string in the shell (it
  wins over `.env.local`), run the script, then clear the variable. See the
  README's Deploying section.
- **Changing production data outside the admin** (seeding, SQL): redeploy
  without the build cache. Prerendered pages refresh only through admin saves
  (cache tags) or a new build.
- **Blob:** create the store with public access. Connecting it now uses OIDC:
  it sets `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY`, not the old
  `BLOB_READ_WRITE_TOKEN`, so the upload route uses the presigned flow
  (`handleUploadPresigned` with `issueSignedToken`) and the browser uses
  `uploadPresigned`. Without either variable, production uploads are off and
  the editor says so. Browsers upload straight to `vercel.com/api/blob`, and
  images are served from `*.public.blob.vercel-storage.com`; the
  Content-Security-Policy allows both (a unit test checks the upload host).
  The store's read-write token isn't used, so it can be revoked.
- **Content-Security-Policy:** it lives in `next.config.ts`. Adding a
  third-party script, font, image host, or API means adding it there too, or
  browsers block it (the console says which directive).
- **Tooling:** ESLint stays on v9. `eslint-config-next` 16.3.5 bundles an
  `eslint-plugin-react` that crashes on ESLint 10.
- **Tooling:** `npm audit` reports a moderate esbuild issue inside `drizzle-kit`
  (dev-only CLI, affects esbuild's dev server, which drizzle-kit never starts).
  The suggested "fix" downgrades drizzle-kit to 0.18, so ignore it.
