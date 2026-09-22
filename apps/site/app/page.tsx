import { BuiltOn } from "@/components/built-on";
import { CTA } from "@/components/cta";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { SupportedAssets } from "@/components/supported-assets";

export default function LandingPage() {
	return (
		<main>
			<Hero />
			<HowItWorks />
			<Features />
			<SupportedAssets />
			<BuiltOn />
			<CTA />
			<Footer />
		</main>
	);
}
