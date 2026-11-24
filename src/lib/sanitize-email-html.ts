import DOMPurify from "isomorphic-dompurify";

/**
 * Strips active script tags, executable event handlers, iframes, forms, and embed elements
 * from user-supplied email template HTML to prevent Stored XSS attacks in preview contexts.
 *
 * Note on <style> tags: <style> elements remain explicitly forbidden because email previews
 * in device-preview.tsx and version-history-drawer.tsx are currently rendered in-DOM via
 * dangerouslySetInnerHTML without iframe/Shadow DOM boundary isolation. Allowing arbitrary
 * <style> blocks would permit CSS injection that bleeds into the host application DOM
 * (e.g. defacing UI, hiding navigation, or clickjacking). Inline style="..." attributes on
 * safe elements are preserved. If full <style> tag preview is needed in the future,
 * the preview components should be refactored to an isolated <iframe srcDoc={...}>.
 */
export function sanitizeEmailHtml(html: string | null | undefined): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "frame",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "base",
      "link",
      "meta",
    ],
    ALLOW_DATA_ATTR: false,
  });
}
