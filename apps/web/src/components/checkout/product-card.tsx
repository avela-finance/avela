"use client";

import type { DemoProduct } from "@/lib/demo-products";

export function ProductCard({
	product,
	onAdd,
}: {
	product: DemoProduct;
	onAdd: (productId: string) => void;
}) {
	return (
		<div className="flex flex-col rounded-xl border border-border bg-card p-6">
			<div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-muted">
				<img
					src={product.image}
					alt={product.name}
					className="h-16 w-16 object-contain"
				/>
			</div>
			<h3 className="text-lg font-semibold">{product.name}</h3>
			<p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
			<div className="mt-4 flex items-center justify-between">
				<span className="text-xl font-bold">${product.price}</span>
				<button
					type="button"
					onClick={() => onAdd(product.id)}
					className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Add to Cart
				</button>
			</div>
		</div>
	);
}
