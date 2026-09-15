type AdminPageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  /** Buttons shown beside the title. */
  actions?: React.ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-line pb-6">
      <div>
        <h1 className="font-mono text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-extralight tracking-[-0.02em] text-star font-stretch-semi-expanded">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-reading text-dust">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

/** Published / Draft indicator for content rows. */
export function StatusBadge({ status }: { status: "draft" | "published" }) {
  const published = status === "published";
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.14em] uppercase">
      <span
        aria-hidden="true"
        className={
          published
            ? "size-1.5 rounded-full bg-flare shadow-[0_0_8px_1px_rgb(255_106_77/0.5)]"
            : "size-1.5 rounded-full border border-faint"
        }
      />
      <span className={published ? "text-star" : "text-faint"}>
        {published ? "Published" : "Draft"}
      </span>
    </span>
  );
}
