import { BuiltOn } from "@/components/built-on";
import { CTA } from "@/components/cta";
import { FAQ } from "@/components/faq";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Global } from "@/components/global";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Nav } from "@/components/nav";
import { PhoneMoment } from "@/components/phone-moment";
import { Products } from "@/components/products";
import { SupportedAssets } from "@/components/supported-assets";

export default function LandingPage() {
	return (
		<main id="top">
			<Nav />
			<Hero />
			<BuiltOn />
			<HowItWorks />
			<Products />
			<Features />
			<PhoneMoment />
			<SupportedAssets />
			<Global />
			<FAQ />
			<CTA />
			<Footer />
		</main>
	);
}
