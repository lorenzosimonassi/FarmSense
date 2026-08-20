import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/sections/Hero"
import { ProblemSection } from "@/components/sections/ProblemSection"
import { SolutionSection } from "@/components/sections/SolutionSection"
import { FeaturesSection } from "@/components/sections/FeaturesSection"
import { DashboardSection } from "@/components/sections/DashboardSection"
import { HowItWorks } from "@/components/sections/HowItWorks"
import { BenefitsSection } from "@/components/sections/BenefitsSection"
import { DifferentialsSection } from "@/components/sections/DifferentialsSection"
import { CTASection } from "@/components/sections/CTASection"

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <DashboardSection />
        <HowItWorks />
        <BenefitsSection />
        <DifferentialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default App
