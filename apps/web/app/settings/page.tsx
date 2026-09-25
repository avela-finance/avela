"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface IdentityData {
	username?: string | null;
}

export default function SettingsPage() {
	const { getAccessToken, user } = usePrivy();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Section 1: Username
	const [username, setUsername] = useState("");
	const [currentUsername, setCurrentUsername] = useState<string | null>(null);
	const [savingUsername, setSavingUsername] = useState(false);

	// Section 2: WhatsApp
	const [phoneNumber, setPhoneNumber] = useState("");
	const [savingWhatsApp, setSavingWhatsApp] = useState(false);

	// Fetch current username on mount
	useEffect(() => {
		async function fetchIdentity() {
			try {
				setLoading(true);
				setError(null);
				const token = await getAccessToken();

				const response = await api.get<IdentityData>("/identity/me", { token });
				if (response.data.username) {
					setCurrentUsername(response.data.username);
				}
			} catch (err) {
				console.error("Failed to fetch identity:", err);
				// Don't treat as fatal error - settings page can still show
			} finally {
				setLoading(false);
			}
		}

		fetchIdentity();
	}, [getAccessToken]);

	const handleUsernameChange = (value: string) => {
		// Enforce lowercase
		setUsername(value.toLowerCase());
	};

	async function handleRegisterUsername() {
		if (!username.trim()) {
			setError("Username cannot be empty");
			return;
		}

		try {
			setSavingUsername(true);
			setError(null);
			setSuccess(null);
			const token = await getAccessToken();

			await api.post("/identity/register", { token, body: { username: username.trim() } });
			setCurrentUsername(username.trim());
			setUsername("");
			setSuccess("Username registered successfully");
		} catch (err) {
			console.error("Failed to register username:", err);
			setError(err instanceof Error ? err.message : "Failed to register username");
		} finally {
			setSavingUsername(false);
		}
	}

	async function handleLinkWhatsApp() {
		if (!phoneNumber.trim()) {
			setError("Phone number cannot be empty");
			return;
		}

		try {
			setSavingWhatsApp(true);
			setError(null);
			setSuccess(null);
			const token = await getAccessToken();

			await api.post("/integrations/whatsapp/link", {
				token,
				body: { phoneNumber: phoneNumber.trim() },
			});
			setPhoneNumber("");
			setSuccess("WhatsApp linked successfully");
		} catch (err) {
			console.error("Failed to link WhatsApp:", err);
			setError(err instanceof Error ? err.message : "Failed to link WhatsApp");
		} finally {
			setSavingWhatsApp(false);
		}
	}

	const walletAddress = user?.wallet?.address ?? "Not connected";

	// Payment link: short `pay.useavela.xyz/<user>` in production,
	// same-origin `/pay/<user>` everywhere else (local, previews).
	let paymentHref = "#";
	let paymentLabel = "";
	if (currentUsername) {
		if (typeof window !== "undefined" && window.location.hostname.endsWith("useavela.xyz")) {
			paymentHref = `https://pay.useavela.xyz/${currentUsername}`;
			paymentLabel = `pay.useavela.xyz/${currentUsername}`;
		} else {
			paymentHref = `/pay/${currentUsername}`;
			paymentLabel =
				typeof window !== "undefined"
					? `${window.location.origin}/pay/${currentUsername}`
					: `app.useavela.xyz/pay/${currentUsername}`;
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Settings</h1>
				<p className="text-muted-foreground mt-1">
					Manage your profile, integrations, and connected wallet
				</p>
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{success && (
				<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
					<p className="text-sm text-primary">{success}</p>
				</div>
			)}

			{loading ? (
				<div className="space-y-6">
					<div className="rounded-md bg-muted/50 p-5 space-y-5">
						<div className="space-y-2">
							<div className="h-4 w-32 animate-pulse rounded bg-muted" />
							<div className="h-10 animate-pulse rounded bg-muted" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-48 animate-pulse rounded bg-muted" />
							<div className="h-10 animate-pulse rounded bg-muted" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-40 animate-pulse rounded bg-muted" />
							<div className="h-10 animate-pulse rounded bg-muted" />
						</div>
					</div>
				</div>
			) : (
				<div className="max-w-2xl space-y-6">
					{/* Section 1: Username & Payment Link */}
					<div className="rounded-md bg-muted/50 p-5 space-y-3">
						<h2 className="text-sm font-medium text-muted-foreground">Username & Payment Link</h2>

						{currentUsername && (
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Your payment link:</p>
								<a
									href={paymentHref}
									className="font-mono text-sm text-primary underline underline-offset-4"
								>
									{paymentLabel}
								</a>
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="username" className="block text-sm font-medium text-foreground">
								{currentUsername ? "Update Username" : "Register Username"}
							</label>
							<input
								id="username"
								type="text"
								placeholder="myusername"
								value={username}
								onChange={(e) => handleUsernameChange(e.target.value)}
								className="rounded-sm border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none w-full"
							/>
						</div>

						<button
							type="button"
							onClick={handleRegisterUsername}
							disabled={savingUsername || !username.trim()}
							className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{savingUsername
								? "Registering…"
								: currentUsername
									? "Update Username"
									: "Register Username"}
						</button>
					</div>

					{/* Section 2: WhatsApp Access */}
					<div className="rounded-md bg-muted/50 p-5 space-y-3">
						<h2 className="text-sm font-medium text-muted-foreground">WhatsApp Access</h2>

						<p className="text-sm text-muted-foreground">
							Link your WhatsApp to approve payments and check balances from messaging.
						</p>

						<div className="space-y-2">
							<label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">
								Phone Number
							</label>
							<input
								id="phoneNumber"
								type="tel"
								placeholder="+1234567890"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								className="rounded-sm border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none w-full"
							/>
						</div>

						<button
							type="button"
							onClick={handleLinkWhatsApp}
							disabled={savingWhatsApp || !phoneNumber.trim()}
							className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{savingWhatsApp ? "Linking…" : "Link WhatsApp"}
						</button>
					</div>

					{/* Section 3: Connected Wallet */}
					<div className="rounded-md bg-muted/50 p-5 space-y-3">
						<h2 className="text-sm font-medium text-muted-foreground">Connected Wallet</h2>

						<p className="font-mono text-sm text-foreground break-all">{walletAddress}</p>
					</div>
				</div>
			)}
		</div>
	);
}
