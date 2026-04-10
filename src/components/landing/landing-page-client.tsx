"use client";

import { LandingBottomNav } from "@/components/landing/landing-bottom-nav";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFeatureCards } from "@/components/landing/landing-feature-cards";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingMobileHeader } from "@/components/landing/landing-mobile-header";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPerformanceSection } from "@/components/landing/landing-performance-section";
import { LandingPricingCards } from "@/components/landing/landing-pricing-cards";
import { LandingTopRankSection } from "@/components/landing/landing-toprank-section";

export function LandingPageClient() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafb] font-sans text-zinc-900 antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>
      <LandingNavbar />
      <LandingMobileHeader />
      <main id="main" className="pb-28 md:pb-0">
        <LandingHero />
        <LandingFeatureCards />
        <LandingHowItWorks />
        <LandingTopRankSection />
        <LandingPerformanceSection />
        <LandingPricingCards />
        <LandingCtaSection />
        <footer className="border-t border-zinc-200/80 px-4 py-10 md:py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-zinc-500 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} ClassteacherAI</p>
            <p className="max-w-md sm:text-right">
              Built for students who want rank — not noise.
            </p>
          </div>
        </footer>
      </main>
      <LandingBottomNav />
    </div>
  );
}
