const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function buildUrl(
	path: string,
	base: string = API_BASE_URL,
	params?: Record<string, string | undefined>,
): string {
	const url = `${base}${path}`;
	if (!params) return url;

	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			searchParams.set(key, value);
		}
	}
	const qs = searchParams.toString();
	return qs ? `${url}?${qs}` : url;
}

export function formatApiError(body: unknown): string {
	if (
		typeof body === "object" &&
		body !== null &&
		"error" in body &&
		typeof (body as Record<string, unknown>).error === "object" &&
		(body as Record<string, unknown>).error !== null
	) {
		const err = (body as { error: { message?: string } }).error;
		if (typeof err.message === "string") return err.message;
	}
	return "An unexpected error occurred";
}

type ApiResponse<T> = {
	data: T;
	meta?: { requestId: string; timestamp: string };
};

type RequestOptions = {
	params?: Record<string, string | undefined>;
	body?: unknown;
	token?: string | null;
};

async function request<T>(
	method: string,
	path: string,
	options: RequestOptions = {},
): Promise<ApiResponse<T>> {
	const url = buildUrl(path, API_BASE_URL, options.params);

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (options.token) {
		headers.Authorization = `Bearer ${options.token}`;
	}

	const res = await fetch(url, {
		method,
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	if (!res.ok) {
		const errorBody = await res.json().catch(() => null);
		throw new Error(formatApiError(errorBody));
	}

	return res.json() as Promise<ApiResponse<T>>;
}

export const api = {
	get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
	post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
	put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
	delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
