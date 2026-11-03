import { describe, expect, it } from "vitest";

import { COUNTRY_DIAL_OPTIONS, parsePhoneNumber } from "./phone-input";

describe("parsePhoneNumber", () => {
  it("defaults to India (+91) when value is empty or undefined", () => {
    expect(parsePhoneNumber("")).toEqual({
      dialCode: "+91",
      nationalNumber: "",
      countryCode: "IN",
    });

    expect(parsePhoneNumber(null)).toEqual({
      dialCode: "+91",
      nationalNumber: "",
      countryCode: "IN",
    });

    expect(parsePhoneNumber(undefined)).toEqual({
      dialCode: "+91",
      nationalNumber: "",
      countryCode: "IN",
    });
  });

  it("parses valid Indian E.164 phone numbers (+91)", () => {
    const result = parsePhoneNumber("+919876543210");
    expect(result).toEqual({
      dialCode: "+91",
      nationalNumber: "9876543210",
      countryCode: "IN",
    });
  });

  it("parses international phone numbers (+1, +44, +971)", () => {
    // US (+1)
    const usResult = parsePhoneNumber("+14155552671");
    expect(usResult).toEqual({
      dialCode: "+1",
      nationalNumber: "4155552671",
      countryCode: "US",
    });

    // UK (+44)
    const ukResult = parsePhoneNumber("+447911123456");
    expect(ukResult).toEqual({
      dialCode: "+44",
      nationalNumber: "7911123456",
      countryCode: "GB",
    });

    // UAE (+971)
    const uaeResult = parsePhoneNumber("+971501234567");
    expect(uaeResult).toEqual({
      dialCode: "+971",
      nationalNumber: "501234567",
      countryCode: "AE",
    });
  });

  it("cleans raw non-digits from national number", () => {
    const spaced = parsePhoneNumber("+91 98765 43210");
    expect(spaced.nationalNumber).toBe("9876543210");
    expect(spaced.countryCode).toBe("IN");
  });

  it("contains India as the first country option with +91", () => {
    expect(COUNTRY_DIAL_OPTIONS[0]?.code).toBe("IN");
    expect(COUNTRY_DIAL_OPTIONS[0]?.dialCode).toBe("+91");
  });
});
