# Tony Vega — portfolio

Personal portfolio and blog with a private admin panel.

- **Next.js 16.3** (App Router, Cache Components) + **TypeScript**
- **Tailwind CSS 4.3**
- **Postgres** via **Drizzle ORM**: Docker locally, Neon in production
- **Markdown** content rendered on the server, with Shiki code highlighting
- Coming in later phases: Better Auth (admin login), Vercel Blob (images)

The full plan, decisions, and phase checklist are in [docs/PLAN.md](docs/PLAN.md).

## Requirements

- Node.js 20.9 or newer
- Docker Desktop (for the local database)

## Getting started

```bash
npm install
cp .env.example .env.local   # values already match docker-compose.yml
npm run db:up                # start Postgres on localhost:5434
npm run db:migrate           # create the tables
npm run db:seed              # load the starting content
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
| `npm run stars` | Regenerate the starfield background tiles |

## Project layout

```
src/
  app/                   routes: home, projects, blog, about, 404, icon
    globals.css          design tokens ("Deep Field"), base and Markdown styles
  components/            page shell and shared UI
    hero/                the hero slot and its CSS-only placeholder
  config/site.ts         site name, navigation, links
  data/                  cached, server-only reads for pages
  db/
    schema.ts            tables: projects, posts, tags, about_page
    index.ts             Drizzle client (server-only)
  lib/
    cache-tags.ts        cache tag names shared by reads and (later) admin saves
    markdown/            Markdown pipeline and the code highlighting theme
    env.ts               validated server environment variables
drizzle/                 generated SQL migrations
scripts/
  seed/                  seed runner, content entries, and Markdown bodies
  generate-starfield.mjs starfield tile generator
public/images/           project screenshots and the About portrait
featured-projects-ref/   source READMEs for the featured project write-ups
docs/PLAN.md             plan, decisions, and progress
```

## Content

Projects and posts are **drafts** or **published**. Drafts never appear on the
site; their URLs return 404. Until the admin panel exists (Phase 3), change
content in `scripts/seed/` and run `npm run db:seed -- --force`, or edit rows
directly with `npm run db:studio`.

Markdown bodies should start their sections at `##`. The page title is the only
`#` heading, and any `#` in a body is shown as a section heading.

## Environment variables

See [.env.example](.env.example).

| Name | Used for |
| --- | --- |
| `DATABASE_URL` | App database connection (pooled on Neon) |
| `DATABASE_URL_UNPOOLED` | Migrations and seeding (direct connection on Neon) |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs in metadata |

## Troubleshooting

- **Port 5434 is taken:** change the host port in `docker-compose.yml` and in `.env.local`.
- **Database container is slow to become healthy:** after Docker Desktop is shut down
  abruptly, Postgres recovers before accepting connections. `npm run db:up` waits for it.
- **A cover image never loads in `next dev`:** restart the dev server. Navigating away
  while an image is still being optimized can leave that request stuck (dev only).
