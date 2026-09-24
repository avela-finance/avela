export function Footer() {
	return (
		<footer className="dark bg-background px-4 py-10 border-t border-border">
			<div className="max-w-5xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
				<p className="text-sm tabular-nums text-muted-foreground">© 2026 Avela</p>
				<nav aria-label="Footer" className="flex items-center gap-5 text-sm text-muted-foreground">
					<a
						href="https://app.useavela.xyz"
						className="transition-colors duration-300 hover:text-foreground"
					>
						App
					</a>
					<a
						href="https://github.com/avela-finance"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors duration-300 hover:text-foreground"
					>
						Docs
					</a>
					<a
						href="https://github.com/avela-finance"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors duration-300 hover:text-foreground"
					>
						GitHub
					</a>
					<a
						href="https://x.com/avela_xyz"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors duration-300 hover:text-foreground"
					>
						X
					</a>
					{/* TODO: point Privacy and Terms at real pages once published. Disabled spans until then. */}
					<span aria-disabled="true" className="cursor-not-allowed opacity-40">
						Privacy
					</span>
					<span aria-disabled="true" className="cursor-not-allowed opacity-40">
						Terms
					</span>
				</nav>
			</div>
		</footer>
	);
}
