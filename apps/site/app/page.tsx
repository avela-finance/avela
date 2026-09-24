import { BuiltOn } from "@/components/built-on";
import { FAQ } from "@/components/faq";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Nav } from "@/components/nav";
import { PhoneMoment } from "@/components/phone-moment";
import { PhotoCTA } from "@/components/photo-cta";
import { SupportedAssets } from "@/components/supported-assets";

export default function LandingPage() {
	return (
		<main id="top">
			<Nav />
			<Hero />
			<HowItWorks />
			<PhoneMoment />
			<Features />
			<SupportedAssets />
			<FAQ />
			<BuiltOn />
			<PhotoCTA />
			<Footer />
		</main>
	);
}
