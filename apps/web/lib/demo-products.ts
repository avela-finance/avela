export type DemoProduct = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
	{
		id: "1",
		name: "API Credits",
		description: "1,000 API calls for your application",
		price: 10,
		image: "/products/api-credits.svg",
	},
	{
		id: "2",
		name: "Cloud Compute",
		description: "1 hour of GPU compute time",
		price: 25,
		image: "/products/cloud-compute.svg",
	},
	{
		id: "3",
		name: "Data Feed",
		description: "30-day real-time market data subscription",
		price: 50,
		image: "/products/data-feed.svg",
	},
];

export function getProduct(id: string): DemoProduct | undefined {
	return DEMO_PRODUCTS.find((p) => p.id === id);
}
