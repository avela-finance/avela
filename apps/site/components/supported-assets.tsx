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
	{
		symbol: "wGOOGLx",
		name: "Wrapped Alphabet",
		pool: "Uniswap V3 pool",
		tvl: "$400K+ TVL",
	},
	{
		symbol: "wAAPLx",
		name: "Wrapped Apple",
		pool: "Uniswap V3 pool",
		tvl: "$400K+ TVL",
	},
];

export function SupportedAssets() {
	return (
		<section id="assets" className="bg-background px-4 py-24 scroll-mt-28">
			<div className="max-w-5xl mx-auto">
				<div className="mb-12 text-center">
					<h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-4xl md:text-[60px] md:leading-[0.95]">
						Supported assets
					</h2>
					<p className="mt-3 text-pretty text-muted-foreground">
						Five wrapped xStocks with verified Uniswap V3 liquidity on X Layer.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{assets.map((asset) => (
						<div
							key={asset.symbol}
							className="rounded-xl border border-border bg-card p-6 flex flex-col gap-2"
						>
							<div className="flex items-center justify-between">
								<span className="font-mono text-sm font-medium text-foreground">
									{asset.symbol}
								</span>
								<span className="text-xs font-semibold tabular-nums text-primary">{asset.tvl}</span>
							</div>
							<p className="text-sm text-muted-foreground">{asset.name}</p>
							<span className="mt-1 inline-block w-fit rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
								{asset.pool}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
