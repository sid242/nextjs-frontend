import { describe, expect, it } from "vitest";

import {
  connectAccountSchema,
  createCampaignSchema,
  createTemplateSchema,
  replyConversationSchema,
  sendTemplateMessageSchema,
  sendTextMessageSchema,
} from "./schemas";

describe("WhatsApp Schemas Validation", () => {
  describe("connectAccountSchema", () => {
    it("validates correct WABA connection parameters", () => {
      const valid = {
        wabaId: "1234567890",
        displayName: "My WhatsApp Business",
        accessToken: "EAABxyz...",
      };
      expect(connectAccountSchema.parse(valid)).toEqual({
        ...valid,
        code: undefined,
      });
    });

    it("rejects missing wabaId or accessToken", () => {
      expect(() => connectAccountSchema.parse({ displayName: "Test" })).toThrow();
    });
  });

  describe("createTemplateSchema", () => {
    it("validates a valid utility template definition with multiple buttons", () => {
      const template = {
        name: "order_update_alert",
        category: "UTILITY",
        language: "en",
        headerType: "TEXT",
        headerText: "Order Confirmed",
        bodyText: "Hello {{1}}, your order #{{2}} has been confirmed.",
        footerText: "Thank you for shopping with us",
        buttons: [
          { type: "QUICK_REPLY", text: "View Details" },
          { type: "URL", text: "Track Order", value: "https://example.com/track" },
          { type: "PHONE_NUMBER", text: "Call Support", value: "+14155552671" },
        ],
      };
      const result = createTemplateSchema.parse(template);
      expect(result.name).toBe("order_update_alert");
      expect(result.category).toBe("UTILITY");
      expect(result.buttons).toHaveLength(3);
    });

    it("rejects uppercase and invalid characters in template name", () => {
      expect(() =>
        createTemplateSchema.parse({
          name: "Invalid Template Name!",
          category: "MARKETING",
          language: "en",
          headerType: "NONE",
          bodyText: "Hello",
        }),
      ).toThrow();
    });
  });

  describe("sendTemplateMessageSchema", () => {
    it("validates template message sending input", () => {
      const valid = {
        to: "+14155552671",
        templateName: "appointment_reminder",
        language: "en",
        param1: "John",
      };
      const result = sendTemplateMessageSchema.parse(valid);
      expect(result.to).toBe("+14155552671");
      expect(result.templateName).toBe("appointment_reminder");
    });

    it("rejects short invalid phone numbers", () => {
      expect(() =>
        sendTemplateMessageSchema.parse({
          to: "123",
          templateName: "test",
        }),
      ).toThrow();
    });
  });

  describe("sendTextMessageSchema", () => {
    it("validates direct text within 24-hour window", () => {
      const valid = {
        to: "+919876543210",
        text: "Hello! How can our support team assist you today?",
      };
      const result = sendTextMessageSchema.parse(valid);
      expect(result.text).toBe("Hello! How can our support team assist you today?");
    });
  });

  describe("createCampaignSchema", () => {
    it("validates campaign creation with recipient phone list", () => {
      const valid = {
        name: "Special Black Friday Announcement",
        templateId: "tpl_123",
        recipients: "+14155552671, +919876543210",
      };
      const result = createCampaignSchema.parse(valid);
      expect(result.name).toBe("Special Black Friday Announcement");
    });
  });

  describe("replyConversationSchema", () => {
    it("validates reply text", () => {
      const valid = { text: "Thanks for reaching out!" };
      expect(replyConversationSchema.parse(valid)).toEqual(valid);
    });

    it("rejects empty reply text", () => {
      expect(() => replyConversationSchema.parse({ text: "" })).toThrow();
    });
  });
});
