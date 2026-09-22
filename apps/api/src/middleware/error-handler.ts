import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
	const requestId = c.get("requestId") ?? "unknown";
	const timestamp = new Date().toISOString();

	if (err instanceof ZodError) {
		return c.json(
			{
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request",
					details: err.issues,
				},
				meta: { requestId, timestamp },
			},
			400,
		);
	}

	if (err instanceof HTTPException) {
		return c.json(
			{
				error: {
					code: "HTTP_ERROR",
					message: err.message,
				},
				meta: { requestId, timestamp },
			},
			err.status,
		);
	}

	console.error(`[${requestId}] Unhandled error:`, err);
	return c.json(
		{
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			meta: { requestId, timestamp },
		},
		500,
	);
};
