/**
 * An editor's values after a successful save. Fields the server filled in
 * (`changes`, like a publish date) replace what was sent, unless that field
 * was edited while the save was running: the newer typing wins.
 */
export function mergeSavedChanges<T extends object>(
  current: T,
  sent: T,
  changes: Partial<T>,
): T {
  const next = { ...current };
  for (const key of Object.keys(changes) as (keyof T)[]) {
    if (current[key] === sent[key]) next[key] = changes[key] as T[keyof T];
  }
  return next;
}
