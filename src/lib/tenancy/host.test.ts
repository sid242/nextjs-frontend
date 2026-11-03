import { describe, expect, it } from "vitest";

import { classifyHost, normalizeHost } from "./host";

describe("host utilities", () => {
  describe("normalizeHost", () => {
    it("lowercases hostnames", () => {
      expect(normalizeHost("ACME.Example.COM")).toBe("acme.example.com");
    });

    it("strips port numbers", () => {
      expect(normalizeHost("example.com:3000")).toBe("example.com");
      expect(normalizeHost("localhost:3001")).toBe("localhost");
      expect(normalizeHost("tenant.example.com:443")).toBe("tenant.example.com");
    });

    it("strips trailing dots", () => {
      expect(normalizeHost("example.com.")).toBe("example.com");
      expect(normalizeHost("example.com...")).toBe("example.com");
    });

    it("handles null and undefined gracefully", () => {
      expect(normalizeHost(null)).toBe("");
      expect(normalizeHost(undefined)).toBe("");
      expect(normalizeHost("")).toBe("");
    });
  });

  describe("classifyHost", () => {
    const defaultOptions = {
      baseDomain: "example.com",
      platformHost: "example.com",
      reservedSubdomains: [
        "www",
        "api",
        "app",
        "admin",
        "platform",
        "auth",
        "static",
        "cdn",
        "mail",
        "status",
      ],
    };

    it("classifies base domain as platform", () => {
      const res = classifyHost("example.com", defaultOptions);
      expect(res.classification).toBe("platform");
    });

    it("classifies platform host as platform", () => {
      const res = classifyHost("example.com", defaultOptions);
      expect(res.classification).toBe("platform");
    });

    it("classifies empty or missing host as platform", () => {
      expect(classifyHost("", defaultOptions).classification).toBe("platform");
      expect(classifyHost(null, defaultOptions).classification).toBe("platform");
    });

    it("classifies valid subdomain as subdomain", () => {
      const res = classifyHost("acme.example.com", defaultOptions);
      expect(res.classification).toBe("subdomain");
      expect(res.subdomain).toBe("acme");
    });

    it("classifies reserved subdomains as platform", () => {
      expect(classifyHost("www.example.com", defaultOptions).classification).toBe("platform");
      expect(classifyHost("api.example.com", defaultOptions).classification).toBe("platform");
      expect(classifyHost("app.example.com", defaultOptions).classification).toBe("platform");
      expect(classifyHost("admin.example.com", defaultOptions).classification).toBe("platform");
    });

    it("classifies external/custom domains as custom", () => {
      const res = classifyHost("portal.customer.com", defaultOptions);
      expect(res.classification).toBe("custom");
      expect(res.hostname).toBe("portal.customer.com");
    });

    it("classifies localhost development subdomains correctly", () => {
      const localhostOptions = {
        baseDomain: "localhost",
        platformHost: "localhost",
        reservedSubdomains: ["www", "api", "app"],
      };

      const tenantRes = classifyHost("acme.localhost", localhostOptions);
      expect(tenantRes.classification).toBe("subdomain");
      expect(tenantRes.subdomain).toBe("acme");

      const reservedRes = classifyHost("www.localhost", localhostOptions);
      expect(reservedRes.classification).toBe("platform");
    });
  });
});
