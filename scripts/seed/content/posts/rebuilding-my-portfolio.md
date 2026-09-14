My last two portfolios were a static HTML site and a Flask app. Both did their job, but updating them was a chore. The static site needed code changes for everything, and while the Flask version could publish blog posts, its projects still lived in a seed file. So I rebuilt the whole thing from scratch, planning for an admin panel that manages everything.

## The stack

- **Next.js 16** with the App Router, rendering pages on the server
- **Tailwind CSS 4** for styling
- **Postgres** for content, through **Drizzle ORM**: in Docker on my machine, and on Neon in production
- Coming with the admin panel: **Better Auth** for the login and **Vercel Blob** for images

## Why Postgres, and why Neon

The content is small and connected. Posts and projects share tags, and there's a single About page. That's a natural fit for a relational database.

I compared Neon and Supabase, and one detail decided it. Supabase's free projects pause after a week without activity and have to be restored by hand, which a quiet portfolio would keep running into. Neon's free tier also goes to sleep when it's idle, but it wakes up on its own when the next request arrives.

## Pages that stay fast while the database sleeps

Neon's wake-up can take a second or two, and I didn't want visitors waiting on it. Next.js 16's Cache Components solve that. Data functions are marked with `use cache`, so their results are saved and reused, and each one is tagged with the content it depends on:

```ts
export async function getPublishedProjects(): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.projects);

  // ...query the database
}
```

Pages are prerendered from those cached results, so most visits never touch the database. Once the admin panel is in place, saving a project will revalidate the `projects` tag, and only the pages that show projects will be rebuilt.

## Building the admin instead of adding a CMS

A headless CMS like Payload would have given me a polished admin panel on day one. But this site has exactly three kinds of content: posts, projects, and one About page. A small admin built for just those keeps the app lean, and building it myself is a better showcase than configuring someone else's.

## The look

I wanted the site to feel like an observatory instrument: a deep-space background, hairline rules, catalog numbers, and a single warm accent color. Headings use Martian Mono, a wide monospace font, and the body text uses Instrument Sans. Even the code highlighting uses the same palette.

There's also a small nod to my last name. Vega is one of the brightest stars in the night sky, cataloged as α Lyrae, so the home page carries its catalog name and sky coordinates.

## What's next

For now, the hero on the home page is a CSS-only orrery whose planets follow Kepler's third law. Eventually it will become a real 3D scene built with Three.js and WebGPU. First, though: the admin panel.
