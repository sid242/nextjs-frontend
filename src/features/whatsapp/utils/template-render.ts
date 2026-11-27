import type { TemplateComponentInput, WhatsAppMessage, WhatsAppTemplate } from "../types";

export interface RenderedTemplateData {
  name: string;
  language?: string;
  header?: { format?: string; text?: string };
  body?: string;
  footer?: string;
  buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
}

function substituteVars(text: string, params?: Array<{ type?: string; text?: string }>): string {
  if (!params?.length) return text;
  return text.replace(/\{\{(\d+)\}\}/g, (match, indexStr: string) => {
    const idx = Number(indexStr) - 1;
    return params[idx]?.text ?? match;
  });
}

/**
 * Resolves a sent TEMPLATE message into its full rendered header/body/footer/buttons
 * using either the backend-stored `payload.rendered` snapshot or by matching against
 * the tenant's template catalog.
 */
export function resolveTemplateMessageDisplay(
  msg: WhatsAppMessage,
  templates: WhatsAppTemplate[],
): RenderedTemplateData | null {
  if (msg.messageType !== "TEMPLATE") return null;

  const payload = msg.payload as
    | {
        name?: string;
        language?: string;
        components?: TemplateComponentInput[];
        rendered?: RenderedTemplateData;
      }
    | undefined
    | null;

  if (payload?.rendered) {
    return payload.rendered;
  }

  const template =
    templates.find((t) => msg.templateId && t.id === msg.templateId) ||
    templates.find(
      (t) =>
        payload?.name &&
        t.name === payload.name &&
        (!payload.language || t.language === payload.language),
    );

  if (!template) {
    return payload?.name ? { name: payload.name, language: payload.language } : null;
  }

  const comps = template.components ?? [];
  const headerDef = comps.find((c) => c.type === "HEADER");
  const bodyDef = comps.find((c) => c.type === "BODY");
  const footerDef = comps.find((c) => c.type === "FOOTER");
  const buttonsDef = comps.find((c) => c.type === "BUTTONS");

  const headerParams = payload?.components?.find((c) => c.type === "header")?.parameters;
  const bodyParams = payload?.components?.find((c) => c.type === "body")?.parameters;

  const headerText = headerDef?.text ? substituteVars(headerDef.text, headerParams) : undefined;
  const bodyText = bodyDef?.text ? substituteVars(bodyDef.text, bodyParams) : undefined;

  return {
    name: template.name,
    language: template.language,
    ...(headerDef
      ? {
          header: {
            format: headerDef.format || "TEXT",
            ...(headerText ? { text: headerText } : {}),
          },
        }
      : {}),
    ...(bodyText ? { body: bodyText } : {}),
    ...(footerDef?.text ? { footer: footerDef.text } : {}),
    ...(buttonsDef?.buttons?.length ? { buttons: buttonsDef.buttons } : {}),
  };
}
