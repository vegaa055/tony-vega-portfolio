/** Shown right away when moving between admin pages, while the next one loads. */
export default function AdminLoading() {
  return (
    <div role="status" className="animate-pulse motion-reduce:animate-none">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <div className="border-b border-line pb-6">
          <div className="h-10 w-56 max-w-full rounded-xs bg-nebula" />
          <div className="mt-3 h-4 w-96 max-w-full rounded-xs bg-nebula/70" />
        </div>
        <div className="mt-10 space-y-4">
          <div className="h-4 w-40 rounded-xs bg-nebula/70" />
          <div className="h-11 w-full rounded-xs bg-nebula/50" />
          <div className="h-11 w-full rounded-xs bg-nebula/50" />
          <div className="h-11 w-full rounded-xs bg-nebula/50" />
        </div>
      </div>
    </div>
  );
}
