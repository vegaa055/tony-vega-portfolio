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
| Look | "Cosmic dark" | Deep-space neutrals, one warm accent, Martian Mono + Instrument Sans. |
| Name | Tony Vega | Domain not decided yet; `NEXT_PUBLIC_SITE_URL` keeps it configurable. |
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
- [x] Real 404s for drafts and unknown slugs; production build works with an empty database and a seeded one

### Phase 3: Admin panel ✅

- [x] Better Auth: email + password, sign-ups disabled, account created by script (`admin:create`, recovery with `admin:reset`), login rate-limited
- [x] Optional two-factor login (authenticator app) with backup codes, and password change, on a Security page
- [x] Dashboard listing posts and projects with status, and project display order
- [x] Post and project editors: Markdown toolbar and live preview, images by button, paste, or drag-and-drop (a local folder in development, Vercel Blob in production), gallery, tags, publish/unpublish with dates, delete with confirmation, unsaved-changes warning
- [x] About page editor
- [x] Every admin page and Server Action re-checks the session and validates input
- [x] Tested in the browser: create, edit, publish, uploads, gallery, validation, delete, and saving while signed out or offline

### Phase 4: Polish and quality

- [ ] Design pass and mobile layouts
- [ ] SEO: metadata, generated share images, sitemap, robots, RSS
- [ ] Accessibility and Lighthouse checks
- [ ] Tests: Vitest (units) and Playwright (admin flows)

### Phase 5: Deploy to Vercel

- [ ] **Tony:** GitHub repo, Vercel project, add Neon and Blob from the Vercel dashboard
- [ ] Run migrations against Neon, create the production admin account
- [ ] Security headers, smoke test, optional custom domain

### Later: 3D hero

Swap the placeholder in `src/components/hero/hero-scene.tsx` for a Three.js
`WebGPURenderer` scene (falls back to WebGL 2 automatically). Load it client-side
only, and keep the placeholder as the loading state and the reduced-motion
fallback.

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
- **Detail pages block on purpose:** `/projects/[slug]` and `/blog/[slug]` look
  up content before rendering, so drafts and unknown slugs return real 404s.
  They export `instant = false` to acknowledge Next.js's instant-navigation
  warning. If navigation ever feels slow in production, add `prefetch` to the
  card links rather than wrapping the pages in `<Suspense>`.
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
- **Phase 4, tests:** hidden pages stay in the DOM, so Playwright tests must use
  visibility-aware locators (`getByRole`, `getByLabel`).
- **Phase 4, public errors:** the admin has its own `error.tsx`; the public site
  still uses Next.js's default error page.
- **Uploads outlive content:** deleting a post or project leaves its images in
  storage (the delete dialog says so). A cleanup tool could come later.
- **Phase 4, icons:** only `src/app/icon.svg` exists. Add PNG/ICO fallbacks and an
  `apple-icon`.
- **Phase 5, Neon:** the Vercel integration sets `DATABASE_URL` (pooled, for the
  app) and `DATABASE_URL_UNPOOLED` (direct, for migrations). Cache Components
  requires the Node.js runtime, so no route may use the Edge runtime.
- **Phase 5, auth settings:** set `BETTER_AUTH_SECRET` (a new value, not the
  local one) and `NEXT_PUBLIC_SITE_URL` in Vercel. Preview deployments are
  trusted automatically through `VERCEL_URL` and `VERCEL_BRANCH_URL`. Create the
  production account by running `npm run admin:create` with `DATABASE_URL`
  pointing at Neon.
- **Phase 5, Blob:** create the Blob store with public access. Connecting it
  sets `BLOB_READ_WRITE_TOKEN`; without it, production uploads are turned off
  and the editor says so.
- **Tooling:** ESLint stays on v9. `eslint-config-next` 16.3.5 bundles an
  `eslint-plugin-react` that crashes on ESLint 10.
- **Tooling:** `npm audit` reports a moderate esbuild issue inside `drizzle-kit`
  (dev-only CLI, affects esbuild's dev server, which drizzle-kit never starts).
  The suggested "fix" downgrades drizzle-kit to 0.18, so ignore it.
