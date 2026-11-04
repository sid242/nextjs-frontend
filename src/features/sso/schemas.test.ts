import { describe, expect, it } from "vitest";

import {
  createScimTokenSchema,
  ssoLookupResponseSchema,
  updateTenantSsoConfigSchema,
} from "./schemas";

describe("SSO & SCIM Schemas", () => {
  it("validates valid SAML tenant SSO config update", () => {
    const valid = {
      providerType: "SAML" as const,
      status: "ACTIVE" as const,
      idpEntityId: "https://idp.okta.com/exk123",
      idpSsoUrl: "https://idp.okta.com/app/sso",
      idpCertificate:
        "-----BEGIN CERTIFICATE-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A\n-----END CERTIFICATE-----",
      allowedDomains: ["acme.com", "corp.acme.com"],
      enforceSso: true,
      jitProvisioning: true,
    };

    const parsed = updateTenantSsoConfigSchema.parse(valid);
    expect(parsed.providerType).toBe("SAML");
    expect(parsed.status).toBe("ACTIVE");
    expect(parsed.allowedDomains).toEqual(["acme.com", "corp.acme.com"]);
    expect(parsed.enforceSso).toBe(true);
  });

  it("validates OIDC tenant SSO config update", () => {
    const validOidc = {
      providerType: "OIDC" as const,
      status: "ACTIVE" as const,
      oidcDiscoveryUrl:
        "https://login.microsoftonline.com/tenant/v2.0/.well-known/openid-configuration",
      oidcClientId: "00000000-0000-0000-0000-000000000000",
      allowedDomains: ["microsoft.com"],
      enforceSso: false,
      jitProvisioning: true,
    };

    const parsed = updateTenantSsoConfigSchema.parse(validOidc);
    expect(parsed.providerType).toBe("OIDC");
    expect(parsed.oidcClientId).toBe("00000000-0000-0000-0000-000000000000");
  });

  it("validates SCIM token creation schema", () => {
    const valid = {
      name: "Okta SCIM Production",
      expiresInDays: 90,
    };
    const parsed = createScimTokenSchema.parse(valid);
    expect(parsed.name).toBe("Okta SCIM Production");
    expect(parsed.expiresInDays).toBe(90);

    // Invalid short name
    expect(() => createScimTokenSchema.parse({ name: "a" })).toThrow();
  });

  it("validates SSO lookup response schema", () => {
    const hit = {
      ssoAvailable: true,
      tenantId: "11111111-1111-1111-1111-111111111111",
      tenantSlug: "acme-corp",
      tenantName: "Acme Corporation",
      enforceSso: true,
      providerType: "SAML" as const,
    };
    const parsedHit = ssoLookupResponseSchema.parse(hit);
    expect(parsedHit.ssoAvailable).toBe(true);

    const miss = {
      ssoAvailable: false,
    };
    const parsedMiss = ssoLookupResponseSchema.parse(miss);
    expect(parsedMiss.ssoAvailable).toBe(false);
  });
});
