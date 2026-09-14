type PageHeaderProps = {
  /** Catalog number shown before the eyebrow, e.g. "01". */
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
};

export function PageHeader({
  index,
  eyebrow,
  title,
  description,
}: PageHeaderProps) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-site px-4 pt-16 pb-12 sm:px-8 sm:pt-24 sm:pb-16">
        <p className="animate-rise font-mono text-[0.68rem] tracking-[0.2em] text-faint uppercase">
          <span aria-hidden="true">
            <span className="text-flare">{index}</span> /{" "}
          </span>
          {eyebrow}
        </p>
        <h1 className="mt-5 animate-rise font-mono text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-extralight tracking-[-0.03em] font-stretch-semi-expanded [animation-delay:80ms]">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-reading animate-rise text-lg leading-relaxed text-dust [animation-delay:160ms]">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
