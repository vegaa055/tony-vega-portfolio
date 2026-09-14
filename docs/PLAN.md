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
- **Admin account and sessions**: added by Better Auth in Phase 3

## Phases

### Phase 1: Foundation ✅

- [x] Git repo, Next.js 16.3.5 + Tailwind 4.3 + TypeScript
- [x] Cache Components and typed routes enabled
- [x] Design tokens, fonts, page shell (header, nav, footer, starfield backdrop)
- [x] Hero slot with a CSS-only orrery placeholder
- [x] Local Postgres in Docker, Drizzle schema, first migration
- [x] Home, Projects, Blog, About, and 404 pages with empty states
- [x] Lint, type check, and production build pass

### Phase 2: Public site

- [ ] Markdown rendering: code highlighting, sanitized HTML, heading anchors
- [ ] Data layer: cached reads (`use cache` + `cacheLife` + `cacheTag`)
- [ ] Home: featured projects and latest posts
- [ ] Projects index with tag filter, and a page per project
- [ ] Blog index and post pages
- [ ] About page from the database
- [ ] Seed script: 4 featured projects (from `featured-projects-ref/`), 10 older projects as drafts, About content from the old sites, one sample post

### Phase 3: Admin panel

- [ ] Better Auth: email + password, sign-ups disabled, account created by script, login rate-limited
- [ ] Dashboard listing posts and projects with status
- [ ] Post and project editors: Markdown live preview, drag-and-drop images (Vercel Blob), tags, publish/unpublish, delete with confirmation
- [ ] About page editor
- [ ] Every Server Action re-checks the session and validates input

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

Things discovered in Phase 1 that will matter later.

- **Phase 2, seed script:** `src/db/index.ts` imports `server-only`, which throws
  in plain Node scripts. Give the seed script its own Drizzle client (or run it
  with `--conditions=react-server`).
- **Phase 2, dynamic routes:** `NavLink` calls `usePathname()`. Check that
  `/projects/[slug]` and `/blog/[slug]` still prerender cleanly; wrap in
  `<Suspense>` if Next.js asks for it.
- **Phase 2, caching:** the footer's `cacheLife("days")` caps every page's
  revalidation at one day. That's intended (a daily safety refresh), but content
  caches should still use tags so admin edits show up immediately.
- **Phase 3, auth:** don't rely on `proxy.ts` alone for protection; check the
  session in the admin layout and in every Server Action. Adding a proxy file can
  also cause `usePathname()` hydration mismatches on prerendered pages (see the
  Next.js `usePathname` docs).
- **Phase 4, icons:** only `src/app/icon.svg` exists. Add PNG/ICO fallbacks and an
  `apple-icon`.
- **Phase 5, Neon:** the Vercel integration sets `DATABASE_URL` (pooled, for the
  app) and `DATABASE_URL_UNPOOLED` (direct, for migrations). Cache Components
  requires the Node.js runtime, so no route may use the Edge runtime.
- **Tooling:** ESLint stays on v9. `eslint-config-next` 16.3.5 bundles an
  `eslint-plugin-react` that crashes on ESLint 10.
- **Tooling:** `npm audit` reports a moderate esbuild issue inside `drizzle-kit`
  (dev-only CLI, affects esbuild's dev server, which drizzle-kit never starts).
  The suggested "fix" downgrades drizzle-kit to 0.18, so ignore it.
