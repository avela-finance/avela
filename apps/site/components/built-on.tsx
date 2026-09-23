export function BuiltOn() {
	return (
		<section className="dark bg-background px-4 py-16 border-t border-border">
			<div className="max-w-5xl mx-auto text-center">
				<p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Built on</p>
				<div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
					<a
						href="https://www.okx.com/xlayer"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-foreground"
					>
						X Layer
					</a>
					<span className="text-border">·</span>
					<a
						href="https://www.okx.com"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-foreground"
					>
						OKX
					</a>
					<span className="text-border">·</span>
					<a
						href="https://uniswap.org"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-foreground"
					>
						Uniswap V3
					</a>
					<span className="text-border">·</span>
					<a
						href="https://privy.io"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-foreground"
					>
						Privy
					</a>
				</div>
			</div>
		</section>
	);
}
