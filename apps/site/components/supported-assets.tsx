const assets = [
	{
		symbol: "wSPYx",
		name: "Wrapped S&P 500",
		pool: "USDG pool",
		tvl: "$1.89M TVL",
	},
	{
		symbol: "wQQQx",
		name: "Wrapped Nasdaq-100",
		pool: "USDC pool",
		tvl: "$738K TVL",
	},
	{
		symbol: "wNVDAx",
		name: "Wrapped NVIDIA",
		pool: "USDG pool",
		tvl: "$623K TVL",
	},
];

export function SupportedAssets() {
	return (
		<section className="bg-card px-4 py-24 border-t border-border">
			<div className="max-w-5xl mx-auto">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-semibold tracking-tight text-foreground">
						Supported assets
					</h2>
					<p className="mt-3 text-muted-foreground">
						Five wrapped xStocks with verified Uniswap V3 liquidity on X Layer.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-3">
					{assets.map((asset) => (
						<div
							key={asset.symbol}
							className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2"
						>
							<div className="flex items-center justify-between">
								<span className="font-mono text-sm font-medium text-foreground">
									{asset.symbol}
								</span>
								<span className="text-xs font-semibold text-brand">{asset.tvl}</span>
							</div>
							<p className="text-sm text-muted-foreground">{asset.name}</p>
							<span className="mt-1 inline-block rounded-md bg-brand/10 px-2 py-0.5 text-xs text-brand">
								{asset.pool}
							</span>
						</div>
					))}
				</div>

				<p className="mt-6 text-center text-xs text-muted-foreground">
					Also supported: wGOOGLx · wAAPLx. All pools verified with $400K+ TVL on X Layer.
				</p>
			</div>
		</section>
	);
}
