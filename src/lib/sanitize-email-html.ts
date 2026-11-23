import DOMPurify from "isomorphic-dompurify";

/**
 * Strips active script tags, executable event handlers, iframes, forms, and embed elements
 * from user-supplied email template HTML to prevent Stored XSS attacks in preview contexts.
 */
export function sanitizeEmailHtml(html: string): string {
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
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onmouseout",
      "onkeydown",
      "onkeyup",
      "onfocus",
      "onblur",
      "formaction",
      "action",
    ],
    ALLOW_DATA_ATTR: false,
  });
}
