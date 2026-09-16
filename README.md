# Tony Vega — portfolio

Personal portfolio and blog with a private admin panel. Live at
https://tony-vega-portfolio.vercel.app

- **Next.js 16.3** (App Router, Cache Components) + **TypeScript**
- **Tailwind CSS 4.3**
- **Postgres** via **Drizzle ORM**: Docker locally, Neon in production
- **Markdown** content rendered on the server, with Shiki code highlighting
- **Better Auth** for the admin login, with optional two-factor login
- **Vercel Blob** for images uploaded in production

The full plan, decisions, and phase checklist are in [docs/PLAN.md](docs/PLAN.md).

## Requirements

- Node.js 24
- Docker Desktop (for the local database)

## Getting started

```bash
npm install
cp .env.example .env.local   # then set BETTER_AUTH_SECRET (see the file)
npm run db:up                # start Postgres on localhost:5434
npm run db:migrate           # create the tables
npm run db:seed              # load the starting content
npm run admin:create         # create your admin account
npm run dev                  # http://localhost:3000
```

The production build reads published content from the database, so the
database must be running for `npm run build` too.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also checks Cache Components rules) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then run TypeScript |
| `npm run format` | Format with Prettier (sorts Tailwind classes too) |
| `npm run format:check` | Check formatting without changing files |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests, rerun as you save |
| `npm run test:e2e` | End-to-end tests against a production build (see [Tests](#tests)) |
| `npm run db:up` / `db:down` | Start / stop the local database (data persists) |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Add the starting content; never overwrites existing rows |
| `npm run db:seed -- --force` | Reset seeded rows back to the seed content |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run admin:create` | Create the admin account (only works while none exists) |
| `npm run admin:reset` | Set a new admin password and sign out every session |
| `npm run admin:reset -- --disable-2fa` | Turn off two-factor login if you've lost your app and backup codes |
| `npm run stars` | Regenerate the starfield background tiles |

## The admin panel

Sign in at `/admin`. There's one account, created with `npm run admin:create`;
sign-ups are turned off.

- **Content** lists every project and post, drafts included. Drafts never
  appear on the site: their URLs show the not-found page, hidden from search
  engines.
- **Editors** for projects, posts, and the About page. Writing is Markdown with
  a live preview. Start sections at `##`: the page title is the only `#`
  heading. Saving a published item updates the public page right away.
- **Images** can be added with a button, pasted, or dropped. Locally they're
  saved to `.uploads` (git-ignored) and served from `/uploads`; in production
  they go to Vercel Blob.
  Cover and gallery images need a description (alt text) before saving. Images
  dropped into the text get a placeholder description to replace.
- **Security** turns on two-factor login with an authenticator app, makes new
  backup codes, and changes the password.

Login attempts are limited to 5 a minute. If you're locked out, run
`npm run admin:reset` from the project folder.

## Tests

**Unit tests** (`npm test`) cover the logic that doesn't need a browser:
validation, slugs, Markdown rendering, uploads, the RSS feed, structured data,
and editor helpers. They sit next to the code as `*.test.ts`.

**End-to-end tests** (`npm run test:e2e`) click through the real site in
Chromium: the public pages, every admin flow, login limits, two-factor login,
SEO files, accessibility checks (axe, plus keyboard walk-throughs), and phone
layouts at 320px. Before the first run, install the browser:

```bash
npx playwright install chromium
```

Each run starts from a clean slate without touching your content. With Docker
running, it creates a `portfolio_test` database next to your local one, seeds
it, makes a production build in `.next-e2e`, and serves it on port 3100. Your
dev server can stay open. The report for the last run opens with
`npx playwright show-report`.

Once the repository is on GitHub, GitHub Actions runs formatting, lint, types,
unit tests, and the end-to-end tests on each push to `main` and on pull
requests (`.github/workflows/ci.yml`).

## Deploying

The site runs on Vercel, with Neon for Postgres and Vercel Blob for uploaded
images.

**First time:**

1. Import the GitHub repo into Vercel. Next.js is detected automatically.
2. In the project's **Storage** tab, add **Neon Postgres** and a public
   **Blob** store. Leave **Custom Prefix** empty on both: the app reads
   `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `BLOB_STORE_ID` by those exact
   names. Don't add them by hand.
3. Add `BETTER_AUTH_SECRET` as a **Secret** (a fresh value, see
   [.env.example](.env.example)) for Production and Preview, and
   `NEXT_PUBLIC_SITE_URL` as **Config** (the site's address) for
   **Production only**, so preview deployments use their own address.
4. Deploy. The build applies the migrations, so the database gets its tables
   (the site is still empty).
5. Load the starting content and create the admin account from your machine,
   using Neon's **direct** connection string (its host has no `-pooler`).
   Variables set in the shell win over `.env.local`, and neither script needs
   the production secret (passwords are hashed without it):

   ```powershell
   $env:DATABASE_URL_UNPOOLED = "<neon direct connection string>"
   npm run db:seed
   npm run admin:create
   Remove-Item Env:DATABASE_URL_UNPOOLED
   ```

   The last line keeps later commands in that window off the live database.
   `npm run admin:reset` works against production the same way.

6. Redeploy **without the build cache**. Pages built from an empty database
   don't refresh on their own when the database is changed directly (admin
   saves do refresh them). Then sign in at `/admin` and turn on two-factor
   login under Security.

**Every deploy after that** runs `npm run vercel-build`, which applies pending
migrations before building, so the database schema never lags behind the code.
A failed migration fails the deploy rather than breaking the live site.

Preview deployments get their own Neon branch, and `robots.ts` keeps them out
of search results.

## Project layout

```
src/
  app/
    (site)/              public pages: home, projects, blog, about, and their
                         share images (opengraph-image.tsx beside each page)
    admin/               login, and the signed-in panel in (panel)/
    api/auth/            Better Auth's endpoints
    api/uploads/         image uploads (local folder or Vercel Blob)
    uploads/[file]/      serves images uploaded locally
    feed.xml/            the blog's RSS feed
    sitemap.ts, robots.ts, manifest.ts, apple-icon.tsx
    globals.css          design tokens ("Deep Field"), base and Markdown styles
  components/            page shell and shared UI
    admin/               admin shell, editors, and form fields
    hero/                the hero slot and its CSS-only placeholder
  config/site.ts         site name, navigation, links, section headers
  data/                  server-only reads (cached for pages; uncached for the admin)
  db/
    schema.ts            content tables: projects, posts, tags, about_page
    auth-schema.ts       Better Auth tables (generated, then edited; see its header)
    index.ts             Drizzle client (server-only)
  lib/
    auth/                Better Auth setup, session checks, browser client
    uploads/             upload rules shared by the browser and the server
    markdown/            Markdown pipeline and the code highlighting theme
    og/card.tsx          draws the share images
    metadata.ts          page metadata: canonical address, Open Graph, feed link
    json-ld.ts           structured data for search engines
    feed.ts              RSS builder
    validation.ts        input rules shared by the editors and Server Actions
    cache-tags.ts        cache tag names shared by reads and admin saves
    env.ts               validated server environment variables
e2e/                     end-to-end tests (Playwright)
drizzle/                 generated SQL migrations
scripts/
  admin/                 create and reset the admin account
  auth/                  config for Better Auth's schema generator
  e2e/                   sets up the test database before end-to-end tests
  seed/                  seed runner, content entries, and Markdown bodies
  generate-starfield.mjs starfield tile generator
assets/fonts/            fonts for the share images (SIL Open Font License)
public/images/           project screenshots and the About portrait
featured-projects-ref/   source READMEs for the featured project write-ups
docs/PLAN.md             plan, decisions, and progress
```

## Environment variables

See [.env.example](.env.example).

| Name | Used for |
| --- | --- |
| `DATABASE_URL` | App database connection (pooled on Neon) |
| `DATABASE_URL_UNPOOLED` | Migrations and seeding (direct connection on Neon) |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs in metadata, and the admin login's allowed origin |
| `BETTER_AUTH_SECRET` | Signs admin sessions. 32+ random characters, different in every environment |
| `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` | Image uploads in production. Set by connecting a Vercel Blob store (uploads sign in with Vercel's rotating OIDC credentials); leave unset locally |

The end-to-end tests set a few more for their own server: `LOCAL_UPLOADS` and
`LOCAL_UPLOAD_DIR` (save uploads to disk in a production build), `NEXT_DIST_DIR`
(a separate build folder), and, in CI, `E2E_DATABASE_URL`. See `e2e/env.ts`.

## Troubleshooting

- **Port 5434 is taken:** change the host port in `docker-compose.yml` and in `.env.local`.
- **Database container is slow to become healthy:** after Docker Desktop is shut down
  abruptly, Postgres recovers before accepting connections. `npm run db:up` waits for it.
- **Pages fail with a database connection error:** Docker Desktop may have closed
  (after a restart, for example). Start it, then run `npm run db:up`.
- **"Too many attempts" when signing in:** wait a minute. Login is rate limited.
- **A cover image never loads in `next dev`:** restart the dev server. Navigating away
  while an image is still being optimized can leave that request stuck (dev only).
