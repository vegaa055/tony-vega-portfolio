# Tony Vega — portfolio

Personal portfolio and blog with a private admin panel.

- **Next.js 16.3** (App Router, Cache Components) + **TypeScript**
- **Tailwind CSS 4.3**
- **Postgres** via **Drizzle ORM**: Docker locally, Neon in production
- **Markdown** content rendered on the server, with Shiki code highlighting
- **Better Auth** for the admin login, with optional two-factor login
- **Vercel Blob** for images uploaded in production

The full plan, decisions, and phase checklist are in [docs/PLAN.md](docs/PLAN.md).

## Requirements

- Node.js 20.9 or newer
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
  appear on the site, and their URLs return 404.
- **Editors** for projects, posts, and the About page. Writing is Markdown with
  a live preview. Start sections at `##`: the page title is the only `#`
  heading. Saving a published item updates the public page right away.
- **Images** can be added with a button, pasted, or dropped. Locally they're
  saved to `public/uploads` (git-ignored); in production they go to Vercel Blob.
  Cover and gallery images need a description (alt text) before saving. Images
  dropped into the text get a placeholder description to replace.
- **Security** turns on two-factor login with an authenticator app, makes new
  backup codes, and changes the password.

Login attempts are limited to 5 a minute. If you're locked out, run
`npm run admin:reset` from the project folder.

## Project layout

```
src/
  app/
    (site)/              public pages: home, projects, blog, about
    admin/               login, and the signed-in panel in (panel)/
    api/auth/            Better Auth's endpoints
    api/uploads/         image uploads (local folder or Vercel Blob)
    globals.css          design tokens ("Deep Field"), base and Markdown styles
  components/            page shell and shared UI
    admin/               admin shell, editors, and form fields
    hero/                the hero slot and its CSS-only placeholder
  config/site.ts         site name, navigation, links
  data/                  server-only reads (cached for pages; uncached for the admin)
  db/
    schema.ts            content tables: projects, posts, tags, about_page
    auth-schema.ts       Better Auth tables (generated, then edited; see its header)
    index.ts             Drizzle client (server-only)
  lib/
    auth/                Better Auth setup, session checks, browser client
    uploads/             upload rules shared by the browser and the server
    markdown/            Markdown pipeline and the code highlighting theme
    validation.ts        input rules shared by the editors and Server Actions
    cache-tags.ts        cache tag names shared by reads and admin saves
    env.ts               validated server environment variables
drizzle/                 generated SQL migrations
scripts/
  admin/                 create and reset the admin account
  auth/                  config for Better Auth's schema generator
  seed/                  seed runner, content entries, and Markdown bodies
  generate-starfield.mjs starfield tile generator
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
| `BLOB_READ_WRITE_TOKEN` | Image uploads in production. Set by connecting a Vercel Blob store; leave unset locally |

## Troubleshooting

- **Port 5434 is taken:** change the host port in `docker-compose.yml` and in `.env.local`.
- **Database container is slow to become healthy:** after Docker Desktop is shut down
  abruptly, Postgres recovers before accepting connections. `npm run db:up` waits for it.
- **Pages fail with a database connection error:** Docker Desktop may have closed
  (after a restart, for example). Start it, then run `npm run db:up`.
- **"Too many attempts" when signing in:** wait a minute. Login is rate limited.
- **A cover image never loads in `next dev`:** restart the dev server. Navigating away
  while an image is still being optimized can leave that request stuck (dev only).
