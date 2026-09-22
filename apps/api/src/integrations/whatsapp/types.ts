import type { InteractiveAction } from "@avela/core/domain/types";

export type WhatsAppConfig = {
	phoneNumberId: string;
	accessToken: string;
	verifyToken: string;
};

export type WhatsAppTextPayload = {
	messaging_product: "whatsapp";
	to: string;
	type: "text";
	text: { body: string };
};

export type WhatsAppInteractivePayload = {
	messaging_product: "whatsapp";
	to: string;
	type: "interactive";
	interactive: {
		type: "button";
		body: { text: string };
		action: {
			buttons: Array<{
				type: "reply";
				reply: { id: string; title: string };
			}>;
		};
	};
};

export type WhatsAppTemplatePayload = {
	messaging_product: "whatsapp";
	to: string;
	type: "template";
	template: {
		name: string;
		language: { code: string };
		components?: Array<{
			type: "body";
			parameters: Array<{ type: "text"; text: string }>;
		}>;
	};
};

export type WhatsAppWebhookEntry = {
	id: string;
	changes: Array<{
		value: {
			messaging_product: "whatsapp";
			metadata: { display_phone_number: string; phone_number_id: string };
			messages?: Array<{
				from: string;
				id: string;
				timestamp: string;
				type: "text" | "interactive" | "button";
				text?: { body: string };
				interactive?: { type: "button_reply"; button_reply: { id: string; title: string } };
			}>;
			statuses?: Array<{
				id: string;
				status: "sent" | "delivered" | "read" | "failed";
				timestamp: string;
				recipient_id: string;
			}>;
		};
		field: "messages";
	}>;
};

export type WhatsAppClient = {
	sendTextMessage(to: string, body: string): Promise<void>;
	sendInteractiveButtons(to: string, body: string, actions: InteractiveAction[]): Promise<void>;
	sendTemplate(
		to: string,
		templateName: string,
		languageCode: string,
		parameters?: string[],
	): Promise<void>;
	buildTextPayload(to: string, body: string): WhatsAppTextPayload;
	buildInteractivePayload(
		to: string,
		body: string,
		actions: InteractiveAction[],
	): WhatsAppInteractivePayload;
};
