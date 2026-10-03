import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/sections/Hero"
import { ComparisonSection } from "@/components/sections/ComparisonSection"
import { FeaturesSection } from "@/components/sections/FeaturesSection"
import { DashboardSection } from "@/components/sections/DashboardSection"
import { HowItWorks } from "@/components/sections/HowItWorks"
import { BenefitsSection } from "@/components/sections/BenefitsSection"
import { CTASection } from "@/components/sections/CTASection"

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <main>
        <Hero />
        <ComparisonSection />
        <FeaturesSection />
        <DashboardSection />
        <HowItWorks />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
