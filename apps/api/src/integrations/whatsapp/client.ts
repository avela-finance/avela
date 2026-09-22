import type { InteractiveAction } from "@avela/core";
import type {
	WhatsAppClient,
	WhatsAppConfig,
	WhatsAppInteractivePayload,
	WhatsAppTextPayload,
} from "./types.js";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

export function createWhatsAppClient(config: WhatsAppConfig): WhatsAppClient {
	const { phoneNumberId, accessToken } = config;
	const messagesUrl = `${GRAPH_API_URL}/${phoneNumberId}/messages`;

	async function sendPayload(payload: Record<string, unknown>): Promise<void> {
		const response = await fetch(messagesUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify(payload),
		});
		if (!response.ok) {
			const error = await response.text();
			throw new Error(`WhatsApp API error ${response.status}: ${error}`);
		}
	}

	function buildTextPayload(to: string, body: string): WhatsAppTextPayload {
		return {
			messaging_product: "whatsapp",
			to,
			type: "text",
			text: { body },
		};
	}

	function buildInteractivePayload(
		to: string,
		body: string,
		actions: InteractiveAction[],
	): WhatsAppInteractivePayload {
		return {
			messaging_product: "whatsapp",
			to,
			type: "interactive",
			interactive: {
				type: "button",
				body: { text: body },
				action: {
					buttons: actions.map((a) => ({
						type: "reply" as const,
						reply: { id: a.id, title: a.title },
					})),
				},
			},
		};
	}

	return {
		async sendTextMessage(to: string, body: string): Promise<void> {
			await sendPayload(buildTextPayload(to, body));
		},
		async sendInteractiveButtons(
			to: string,
			body: string,
			actions: InteractiveAction[],
		): Promise<void> {
			await sendPayload(buildInteractivePayload(to, body, actions));
		},
		async sendTemplate(
			to: string,
			templateName: string,
			languageCode: string,
			parameters?: string[],
		): Promise<void> {
			const payload: Record<string, unknown> = {
				messaging_product: "whatsapp",
				to,
				type: "template",
				template: {
					name: templateName,
					language: { code: languageCode },
					...(parameters && {
						components: [
							{
								type: "body",
								parameters: parameters.map((p) => ({ type: "text", text: p })),
							},
						],
					}),
				},
			};
			await sendPayload(payload);
		},
		buildTextPayload,
		buildInteractivePayload,
	};
}
