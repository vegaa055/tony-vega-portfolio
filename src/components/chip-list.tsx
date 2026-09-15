import clsx from "clsx";

type ChipListProps = {
  items: string[];
  /** Names the list for screen readers, e.g. "Built with". */
  label: string;
  className?: string;
};

/** A row of small mono labels: tech stacks, skills. */
export function ChipList({ items, label, className }: ChipListProps) {
  if (items.length === 0) return null;

  return (
    <ul
      aria-label={label}
      className={clsx("flex flex-wrap gap-1.5", className)}
    >
      {items.map((item) => (
        <li
          key={item}
          className="border border-line px-2 py-1 font-mono text-micro tracking-[0.12em] text-dust uppercase"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
