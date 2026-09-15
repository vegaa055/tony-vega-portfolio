// Carries a "Saved" message across the redirect from a new item's editor to
// its edit page, so the confirmation survives the page change. Kept in memory
// only: a reload simply drops it.

let carried: { path: string; message: string } | null = null;

export function carrySavedMessage(path: string, message: string) {
  carried = { path, message };
}

/** The message carried to this page, if a save just opened it. */
export function carriedSavedMessage(path: string) {
  return carried?.path === path ? carried.message : null;
}

export function clearCarriedSavedMessage(path: string) {
  if (carried?.path === path) carried = null;
}
