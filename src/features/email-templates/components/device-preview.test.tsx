import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DevicePreview } from "./device-preview";

describe("DevicePreview Component Tests", () => {
  it("renders default placeholder when htmlContent is empty", () => {
    const html = renderToStaticMarkup(<DevicePreview htmlContent="" subject="Welcome" />);

    expect(html).toContain("No email body content entered yet.");
    expect(html).toContain("Welcome");
  });

  it("replaces standard merge variables in subject and body", () => {
    const template = "<p>Hello {{customer_name}}, welcome to {{project_name}}!</p>";
    const subject = "Hi {{customer_name}}, account is ready";

    const html = renderToStaticMarkup(<DevicePreview htmlContent={template} subject={subject} />);

    // Standard variable samples: customer_name is 'John Doe', project_name is 'Savitara Heights'
    expect(html).toContain("Hello John Doe, welcome to Savitara Heights!");
    expect(html).toContain("Hi John Doe, account is ready");
  });

  it("supports customVariables overrides in subject and body", () => {
    const template = "<p>Your order #{{order_id}} is {{status}}.</p>";
    const subject = "Order update: {{order_id}}";

    const html = renderToStaticMarkup(
      <DevicePreview
        htmlContent={template}
        subject={subject}
        customVariables={{
          order_id: "ORD-9999",
          status: "SHIPPED",
        }}
      />,
    );

    expect(html).toContain("Your order #ORD-9999 is SHIPPED.");
    expect(html).toContain("Order update: ORD-9999");
  });

  it("sanitizes dangerous HTML and scripts via sanitizeEmailHtml", () => {
    const dangerousHtml = `<p>Safe text</p><script>alert('XSS')</script><img src="x" onerror="alert(1)" />`;

    const html = renderToStaticMarkup(
      <DevicePreview htmlContent={dangerousHtml} subject="Security Test" />,
    );

    expect(html).toContain("Safe text");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert('XSS')");
    expect(html).not.toContain("onerror");
  });

  it("renders email header envelope with From, To, and Reply-To correctly", () => {
    const html = renderToStaticMarkup(
      <DevicePreview
        htmlContent="<p>Test</p>"
        subject="Important Notice"
        senderName="Support Team"
        fromEmail="support@customdomain.com"
        replyTo="help@customdomain.com"
      />,
    );

    expect(html).toContain("Support Team");
    expect(html).toContain("&lt;support@customdomain.com&gt;");
    expect(html).toContain("Reply-To:");
    expect(html).toContain("&lt;help@customdomain.com&gt;");
    expect(html).toContain("Important Notice");
  });

  it("renders (No subject) when subject is empty", () => {
    const html = renderToStaticMarkup(<DevicePreview htmlContent="<p>Hello</p>" subject="" />);

    expect(html).toContain("(No subject)");
  });
});
