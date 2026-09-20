/**
 * Turning an account's email into something fit to show.
 *
 * Accounts are keyed by email since login moved off usernames, and greeting
 * someone as "you@example.com" reads badly — so the local part stands in
 * until they fill in a name on the Settings page.
 */

/** The part before the @, or the whole string when there is no @. */
export function displayName(email: string | undefined | null): string {
  const value = (email ?? '').trim();
  const local = value.split('@')[0];
  return local || value;
}

/** One or two letters for an avatar, from a name if there is one. */
export function initials(nameOrEmail: string | undefined | null): string {
  const source = displayName(nameOrEmail);
  if (!source) return '?';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}
