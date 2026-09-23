export function CTA() {
	return (
		<section className="bg-background px-4 py-24 border-t border-border">
			<div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
				<h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
					Start spending from your portfolio.
				</h2>
				<p className="max-w-lg text-muted-foreground">
					Connect your wallet, deposit wrapped xStocks, and unlock spending power in minutes.
				</p>
				<a
					href="https://app.useavela.xyz"
					className="inline-flex items-center gap-1 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Launch App →
				</a>
			</div>
		</section>
	);
}
