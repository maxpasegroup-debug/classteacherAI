import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export const metadata: Metadata = {
  title: "ClassteacherAI — Train Like a Topper",
  description:
    "AI-powered training system with continuous exam loops, TopRank conditioning, and rank-focused performance — until rank becomes inevitable.",
};

export default function HomePage() {
  return <LandingPageClient />;
}
