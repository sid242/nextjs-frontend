import { describe, expect, it } from "vitest";

import {
  getNetworkConnectionInfo,
  isSlowNetworkConnection,
  type NetworkConnectionInfo,
} from "./use-network-status";

describe("useNetworkStatus utilities", () => {
  describe("isSlowNetworkConnection", () => {
    it("identifies 2g and slow-2g as slow networks", () => {
      const slow2g: NetworkConnectionInfo = { effectiveType: "slow-2g", saveData: false };
      const fast2g: NetworkConnectionInfo = { effectiveType: "2g", saveData: false };

      expect(isSlowNetworkConnection(slow2g)).toBe(true);
      expect(isSlowNetworkConnection(fast2g)).toBe(true);
    });

    it("identifies normal 4g as fast network", () => {
      const normal4g: NetworkConnectionInfo = {
        effectiveType: "4g",
        rtt: 80,
        downlink: 15,
        saveData: false,
      };

      expect(isSlowNetworkConnection(normal4g)).toBe(false);
    });

    it("identifies high round-trip latency as slow connection", () => {
      const highLatency: NetworkConnectionInfo = {
        effectiveType: "4g",
        rtt: 1800,
        downlink: 10,
        saveData: false,
      };

      expect(isSlowNetworkConnection(highLatency)).toBe(true);
    });

    it("identifies very low bandwidth downlink as slow connection", () => {
      const lowBandwidth: NetworkConnectionInfo = {
        effectiveType: "3g",
        rtt: 300,
        downlink: 0.2, // 200 kbps
        saveData: false,
      };

      expect(isSlowNetworkConnection(lowBandwidth)).toBe(true);
    });
  });

  describe("getNetworkConnectionInfo", () => {
    it("returns default values when running in node or unsupported browsers", () => {
      const info = getNetworkConnectionInfo();
      expect(info.effectiveType).toBeDefined();
      expect(typeof info.saveData).toBe("boolean");
    });
  });
});
