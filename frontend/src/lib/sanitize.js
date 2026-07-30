import DOMPurify from "dompurify";

// Allowlist of tags actually used for inline highlighting in marketing/demo strings.
const ALLOWED_TAGS = ["mark", "b", "strong", "i", "em", "code", "span", "br"];
const ALLOWED_ATTR = ["class"];

/** Sanitize a hardcoded HTML fragment before feeding into dangerouslySetInnerHTML. */
export function sanitize(html) {
  if (html == null) return "";
  return DOMPurify.sanitize(String(html), { ALLOWED_TAGS, ALLOWED_ATTR });
}

/** Convenience: returns the object shape React expects. */
export const safeHtml = (html) => ({ __html: sanitize(html) });
