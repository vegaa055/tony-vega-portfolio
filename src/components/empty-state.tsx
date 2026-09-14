import { OrbitMark } from "@/components/orbit-mark";
import { Reticle } from "@/components/reticle";

type EmptyStateProps = {
  title: string;
  children?: React.ReactNode;
};

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden px-6 py-16 text-center sm:py-20">
      <div aria-hidden="true" className="dot-grid absolute inset-0" />
      <Reticle />
      <div className="relative">
        <OrbitMark className="mx-auto size-10 text-faint" />
        <p className="mt-6 font-mono text-[0.72rem] tracking-[0.18em] text-dust uppercase">
          {title}
        </p>
        {children ? (
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-faint">
            {children}
          </p>
        ) : null}
      </div>
    </div>
  );
}
