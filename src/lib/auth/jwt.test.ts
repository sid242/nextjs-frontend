import { describe, expect, it } from "vitest";

import { decodeJwt } from "./jwt";

const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");

describe("decodeJwt", () => {
  it("reads claims", () => {
    const token = `${encode({ alg: "HS256" })}.${encode({ sub: "u1", role: "ADMIN", exp: 123 })}.sig`;
    expect(decodeJwt(token)).toMatchObject({ sub: "u1", role: "ADMIN", exp: 123 });
  });
  it("returns null for garbage", () => {
    expect(decodeJwt("nope")).toBeNull();
    expect(decodeJwt("a.b.c")).toBeNull();
  });
});
