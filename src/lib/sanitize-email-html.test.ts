import { describe, expect, it } from "vitest";

import { sanitizeEmailHtml } from "./sanitize-email-html";

describe("sanitizeEmailHtml", () => {
  it("returns empty string when input is empty or null", () => {
    expect(sanitizeEmailHtml("")).toBe("");
    expect(sanitizeEmailHtml(null as unknown as string)).toBe("");
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
});
