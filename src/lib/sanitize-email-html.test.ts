import { describe, expect, it } from "vitest";

import { sanitizeEmailHtml } from "./sanitize-email-html";

describe("sanitizeEmailHtml", () => {
  it("returns empty string when input is empty or null or undefined", () => {
    expect(sanitizeEmailHtml("")).toBe("");
    expect(sanitizeEmailHtml(null)).toBe("");
    expect(sanitizeEmailHtml(undefined)).toBe("");
  });

  it("preserves safe HTML tags and formatting", () => {
    const input =
      '<p>Hello <strong>World</strong>, this is a <a href="https://example.com">link</a>.</p>';
    const output = sanitizeEmailHtml(input);
    expect(output).toContain("<p>Hello <strong>World</strong>, this is a");
    expect(output).toContain('<a href="https://example.com">link</a>');
  });

  it("strips script tags and inline javascript event handlers", () => {
    const input = '<div>Hello<script>alert("XSS")</script><img src="x" onerror="alert(1)" /></div>';
    const output = sanitizeEmailHtml(input);
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("alert");
    expect(output).not.toContain("onerror");
  });

  it("strips iframe, form, object, and embed elements", () => {
    const input =
      '<div><iframe src="https://evil.com"></iframe><form action="/steal"><button>Submit</button></form></div>';
    const output = sanitizeEmailHtml(input);
    expect(output).not.toContain("<iframe");
    expect(output).not.toContain("<form");
    expect(output).not.toContain("<button");
  });

  it("strips javascript: URLs from href attributes", () => {
    const input = '<p><a href="javascript:alert(document.cookie)">Click here</a></p>';
    const output = sanitizeEmailHtml(input);
    expect(output).not.toContain("javascript:");
    expect(output).not.toContain("alert");
    expect(output).toContain("<a>Click here</a>");
  });

  it("sanitizes SVG payloads containing scripts or event handlers", () => {
    const input =
      '<div><svg><script>alert("svg xss")</script><circle cx="50" cy="50" r="40" /></svg><svg onload="alert(1)"></svg></div>';
    const output = sanitizeEmailHtml(input);
    expect(output).not.toContain("<script");
    expect(output).not.toContain("alert");
    expect(output).not.toContain("onload");
    expect(output).toContain("<circle");
  });

  it("sanitizes MathML payloads containing scripts or javascript hrefs", () => {
    const input =
      '<div><math><mtext><script>alert("math xss")</script></mtext></math><math href="javascript:alert(1)"><mtext>formula</mtext></math></div>';
    const output = sanitizeEmailHtml(input);
    expect(output).not.toContain("<script");
    expect(output).not.toContain("javascript:");
    expect(output).not.toContain("alert");
    expect(output).toContain("<math");
    expect(output).toContain("<mtext>formula</mtext>");
  });

  it("strips style tags to prevent DOM pollution while preserving safe inline styles", () => {
    const input =
      '<div><style>body { display: none !important; }</style><p style="color: blue; font-size: 14px;">Blue text</p></div>';
    const output = sanitizeEmailHtml(input);
    expect(output).not.toContain("<style");
    expect(output).not.toContain("display: none");
    expect(output).toContain('style="color: blue; font-size: 14px;"');
    expect(output).toContain("Blue text");
  });
});
