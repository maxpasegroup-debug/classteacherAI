import type { Metadata } from "next";
import { LandingHomeClient } from "@/components/landing/landing-home-client";

export const metadata: Metadata = {
  title: "ClassteacherAI — Train Like a Top Ranker",
  description:
    "Ultra-premium AI training for top ranks. Real exam pressure, Nexa AI coach, TopRank discipline — built for serious aspirants.",
};

export default function MarketingHomePage() {
  return <LandingHomeClient />;
}
