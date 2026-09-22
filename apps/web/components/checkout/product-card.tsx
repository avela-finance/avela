"use client";

import type { DemoProduct } from "@/lib/demo-products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function ProductCard({
	product,
	onAdd,
}: {
	product: DemoProduct;
	onAdd: (productId: string) => void;
}) {
	return (
		<Card>
			<CardContent>
				<div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-muted">
					<img
						src={product.image}
						alt={product.name}
						className="h-16 w-16 object-contain"
					/>
				</div>
				<h3 className="text-base font-semibold">{product.name}</h3>
				<p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
			</CardContent>
			<CardFooter className="flex items-center justify-between">
				<span className="text-xl font-bold">${product.price}</span>
				<Button size="sm" onClick={() => onAdd(product.id)}>
					Add to Cart
				</Button>
			</CardFooter>
		</Card>
	);
}
