import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * `pay.useavela.xyz/<username>` short links.
 *
 * The pay subdomain is aliased to the same deployment (avela-web in Vercel),
 * so bare paths on that host are rewritten to the real `/pay/[username]` route.
 * Localhost, preview, and app hosts are untouched.
 */
export function middleware(req: NextRequest) {
	const host = req.headers.get("host") ?? "";
	if (!host.startsWith("pay.")) return NextResponse.next();

	const url = req.nextUrl.clone();
	if (url.pathname === "/") {
		return NextResponse.redirect("https://app.useavela.xyz");
	}
	if (
		url.pathname.startsWith("/pay/") ||
		url.pathname.startsWith("/_next/") ||
		url.pathname === "/manifest.json" ||
		url.pathname === "/favicon.ico"
	) {
		return NextResponse.next();
	}
	url.pathname = `/pay${url.pathname}`;
	return NextResponse.rewrite(url);
}

export const config = {
	matcher: ["/:path*"],
};
