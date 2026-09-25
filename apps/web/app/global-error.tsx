"use client";

/**
 * Root fallback for errors thrown outside route boundaries (e.g. layout).
 * Must define its own <html>/<body> — no app imports, no theme hooks.
 */
export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#141210",
					color: "#f5f2ec",
					fontFamily: "system-ui, sans-serif",
				}}
			>
				<div style={{ textAlign: "center", padding: 24, maxWidth: 380 }}>
					<h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Avela didn&apos;t load</h1>
					<p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6 }}>
						Your funds and positions are safe. Reload to try again.
					</p>
					<button
						type="button"
						onClick={reset}
						style={{
							marginTop: 24,
							width: "100%",
							padding: "14px 24px",
							borderRadius: 999,
							border: "none",
							background: "#d4f542",
							color: "#1a2005",
							fontSize: 16,
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Reload
					</button>
				</div>
			</body>
		</html>
	);
}
