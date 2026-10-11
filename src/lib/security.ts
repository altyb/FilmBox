/** URL / ID validators for values that come back from TMDB.
 *  TMDB fields like `homepage` are third-party data — never trust them blindly
 *  as link targets. React escapes text, but `href="javascript:..."` still runs
 *  on click, so only http(s) links are allowed through. */

/** Returns the URL only if it is an http(s) link, otherwise null. */
export const safeHttpUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

/** YouTube video keys are 11 chars of [A-Za-z0-9_-]. Anything else is rejected
 *  so a malicious key can never break out of the embed URL. */
export const safeYoutubeKey = (key?: string | null): string | null =>
  key && /^[A-Za-z0-9_-]{11}$/.test(key) ? key : null;

/** IMDb ids are `tt`/`nm` + digits. Rejects anything that would alter the URL. */
export const safeImdbId = (id?: string | null, prefix?: "tt" | "nm"): string | null => {
  if (!id) return null;
  const m = /^(tt|nm)(\d{1,12})$/.exec(id.trim());
  if (!m) return null;
  if (prefix && m[1] !== prefix) return null;
  return m[0];
};
