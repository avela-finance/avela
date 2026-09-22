"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/checkout/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_PRODUCTS } from "@/lib/demo-products";

export default function CheckoutPage() {
	const router = useRouter();
	const [cart, setCart] = useState<string[]>([]);

	function addToCart(productId: string) {
		setCart((prev) => [...prev, productId]);
	}

	const total = cart.reduce((sum, id) => {
		const product = DEMO_PRODUCTS.find((p) => p.id === id);
		return sum + (product?.price ?? 0);
	}, 0);

	return (
		<div>
			<h1 className="mb-2 text-2xl font-bold">Demo Store</h1>
			<p className="mb-8 text-muted-foreground">
				Choose a product and pay with your tokenized stock portfolio.
			</p>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{DEMO_PRODUCTS.map((product) => (
					<ProductCard key={product.id} product={product} onAdd={addToCart} />
				))}
			</div>

			{cart.length > 0 && (
				<Card className="mt-8">
					<CardContent className="flex items-center justify-between">
						<div>
							<span className="text-sm text-muted-foreground">
								{cart.length} item{cart.length > 1 ? "s" : ""}
							</span>
							<span className="ml-4 text-lg font-bold">${total}</span>
						</div>
						<Button
							onClick={() => router.push(`/checkout/pay?products=${cart.join(",")}`)}
						>
							Proceed to Pay
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
