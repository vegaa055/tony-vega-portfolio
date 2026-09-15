import type { Metadata } from "next";
import Link from "next/link";

import { moveProjectAction } from "@/app/admin/actions";
import {
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/admin-page-header";
import { buttonClass, ButtonLink } from "@/components/button-link";
import { getDashboardData } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate, isoDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Content",
};

export const instant = false; // See (panel)/layout.tsx.

// Rows are list items rather than table rows, so they can stack on phones:
// the title on its own line, then status, date, and actions. From sm up they
// line up in columns under the headings.
const columns =
  "sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_7.5rem_10rem] sm:items-center sm:gap-x-4";
const headingRow = `hidden border-b border-field pb-3 font-mono text-micro tracking-[0.14em] text-faint uppercase ${columns}`;
const row = `flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-3.5 ${columns}`;

const sectionHeading =
  "font-mono text-section tracking-[0.2em] text-dust uppercase";

export default async function DashboardPage() {
  await requireAdmin();
  const { projects, posts } = await getDashboardData();

  return (
    <div className="space-y-16">
      <AdminPageHeader
        title="Content"
        description="Everything on the site, drafts included. Drafts never appear publicly."
        actions={
          <>
            <ButtonLink href="/admin/projects/new" size="sm">
              New project
            </ButtonLink>
            <ButtonLink href="/admin/posts/new" size="sm" variant="ghost">
              New post
            </ButtonLink>
          </>
        }
      />

      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading" className={sectionHeading}>
          Projects <span className="text-faint">({projects.length})</span>
        </h2>
        <p className="mt-2 text-sm text-faint">
          Listed in display order. Featured projects also appear on the home
          page.
        </p>

        <div className="mt-6 text-sm">
          <div aria-hidden="true" className={headingRow}>
            <span>Title</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          <ul>
            {projects.map((project, index) => (
              <li key={project.id} className={row}>
                <div className="w-full min-w-0 sm:w-auto">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="inline-block py-1 font-medium text-star hover:text-flare-soft"
                  >
                    {project.title}
                  </Link>
                  {project.featured ? (
                    <span className="ml-3 font-mono text-micro tracking-[0.14em] text-flare uppercase">
                      Featured
                    </span>
                  ) : null}
                </div>
                <StatusBadge status={project.status} />
                <p className="whitespace-nowrap text-dust">
                  <span className="sr-only">Updated </span>
                  <time dateTime={isoDate(project.updatedAt)}>
                    {formatDate(project.updatedAt)}
                  </time>
                </p>
                <div className="ml-auto flex items-center justify-end gap-1">
                  <form action={moveProjectAction.bind(null, project.id, "up")}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      className={buttonClass("quiet", "sm")}
                      aria-label={`Move ${project.title} up`}
                    >
                      ↑
                    </button>
                  </form>
                  <form
                    action={moveProjectAction.bind(null, project.id, "down")}
                  >
                    <button
                      type="submit"
                      disabled={index === projects.length - 1}
                      className={buttonClass("quiet", "sm")}
                      aria-label={`Move ${project.title} down`}
                    >
                      ↓
                    </button>
                  </form>
                  {project.status === "published" ? (
                    <a
                      href={`/projects/${project.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClass("quiet", "sm")}
                    >
                      View
                      <span className="sr-only">
                        {" "}
                        {project.title} (opens in a new tab)
                      </span>
                    </a>
                  ) : (
                    // Keeps the arrows lined up with rows that have a link.
                    <span
                      aria-hidden="true"
                      className={buttonClass("quiet", "sm") + " invisible"}
                    >
                      View
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading" className={sectionHeading}>
          Posts <span className="text-faint">({posts.length})</span>
        </h2>

        <div className="mt-6 text-sm">
          <div aria-hidden="true" className={headingRow}>
            <span>Title</span>
            <span>Status</span>
            <span>Published</span>
          </div>
          <ul>
            {posts.map((post) => (
              <li key={post.id} className={row}>
                <div className="w-full min-w-0 sm:w-auto">
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="inline-block py-1 font-medium text-star hover:text-flare-soft"
                  >
                    {post.title}
                  </Link>
                </div>
                <StatusBadge status={post.status} />
                <p className="whitespace-nowrap text-dust">
                  {post.publishedAt ? (
                    <>
                      <span className="sr-only">Published </span>
                      <time dateTime={isoDate(post.publishedAt)}>
                        {formatDate(post.publishedAt)}
                      </time>
                    </>
                  ) : (
                    <span className="text-faint">Not yet published</span>
                  )}
                </p>
                <div className="ml-auto flex items-center justify-end gap-1">
                  {post.status === "published" ? (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClass("quiet", "sm")}
                    >
                      View
                      <span className="sr-only">
                        {" "}
                        {post.title} (opens in a new tab)
                      </span>
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
