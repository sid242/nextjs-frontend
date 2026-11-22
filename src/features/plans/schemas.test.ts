import { describe, expect, it } from "vitest";

import { tenantBillingOverviewSchema } from "./schemas";

const plan = {
  id: "809e9454-2afa-4cbf-9b3f-1e027522da50",
  key: "PRO",
  name: "Pro",
  currency: "INR",
  billingInterval: "MONTHLY",
  priceMonthlyMinor: 20000,
  priceYearlyMinor: 200000,
  isActive: true,
  isPublic: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const subscription = {
  tenantId: "a27678ad-1226-454c-9a57-a8689f85d806",
  status: "ACTIVE",
  seatCount: 2,
  currentPeriodStart: "2026-01-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  billingInterval: "ANNUAL",
  plan,
};

describe("tenantBillingOverviewSchema", () => {
  it("uses the subscription interval and counts pending invites against available seats", () => {
    const result = tenantBillingOverviewSchema.parse({
      subscription,
      usage: { members: 5, activeMembers: 4 },
      limits: { maxMembers: 5 },
    });
    expect(result?.plan).toMatchObject({ billingInterval: "ANNUAL", priceCents: 200000 });
    expect(result?.usage).toEqual({
      activeMembers: 4,
      occupiedSeats: 5,
      maxMembers: 5,
      remainingSeats: 0,
    });
  });

  it("preserves a zero price and an unlimited seat limit", () => {
    const result = tenantBillingOverviewSchema.parse({
      subscription: { ...subscription, priceSnapshotMinor: 0 },
      usage: { members: 5 },
      limits: { maxMembers: null },
    });
    expect(result?.plan?.priceCents).toBe(0);
    expect(result?.usage.remainingSeats).toBeNull();
  });
});
