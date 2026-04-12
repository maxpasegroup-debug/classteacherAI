import type { Metadata } from "next";
import { PricingPageClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing — ClassteacherAI",
  description: "Basic free, Pro ₹499, Elite ₹1999, TopRank ₹4999. Compare features and unlock rank-focused training.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
