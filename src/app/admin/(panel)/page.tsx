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

const th =
  "border-b border-line-strong px-3 pb-3 text-left font-mono text-[0.6rem] font-normal tracking-[0.14em] text-faint uppercase first:pl-0";
const td = "border-b border-line px-3 py-3.5 align-middle first:pl-0";

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
        <h2
          id="projects-heading"
          className="font-mono text-[0.72rem] tracking-[0.2em] text-dust uppercase"
        >
          Projects <span className="text-faint">({projects.length})</span>
        </h2>
        <p className="mt-2 text-sm text-faint">
          Listed in display order. Featured projects also appear on the home
          page.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Title</th>
                <th className={th}>Status</th>
                <th className={th}>Updated</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={project.id}>
                  <td className={td}>
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="font-medium text-star hover:text-flare-soft"
                    >
                      {project.title}
                    </Link>
                    {project.featured ? (
                      <span className="ml-3 font-mono text-[0.56rem] tracking-[0.14em] text-flare uppercase">
                        Featured
                      </span>
                    ) : null}
                  </td>
                  <td className={td}>
                    <StatusBadge status={project.status} />
                  </td>
                  <td className={td + " whitespace-nowrap text-dust"}>
                    <time dateTime={isoDate(project.updatedAt)}>
                      {formatDate(project.updatedAt)}
                    </time>
                  </td>
                  <td className={td + " pr-0"}>
                    <div className="flex items-center justify-end gap-1">
                      <form
                        action={moveProjectAction.bind(null, project.id, "up")}
                      >
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
                        action={moveProjectAction.bind(
                          null,
                          project.id,
                          "down",
                        )}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="posts-heading">
        <h2
          id="posts-heading"
          className="font-mono text-[0.72rem] tracking-[0.2em] text-dust uppercase"
        >
          Posts <span className="text-faint">({posts.length})</span>
        </h2>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Title</th>
                <th className={th}>Status</th>
                <th className={th}>Published</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className={td}>
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-medium text-star hover:text-flare-soft"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className={td}>
                    <StatusBadge status={post.status} />
                  </td>
                  <td className={td + " whitespace-nowrap text-dust"}>
                    {post.publishedAt ? (
                      <time dateTime={isoDate(post.publishedAt)}>
                        {formatDate(post.publishedAt)}
                      </time>
                    ) : (
                      <span className="text-faint">Not yet</span>
                    )}
                  </td>
                  <td className={td + " pr-0 text-right"}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
