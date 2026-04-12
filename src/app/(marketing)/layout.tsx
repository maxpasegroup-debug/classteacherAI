import { Navbar } from "@/components/Navbar";
import { MarketingAuthProvider } from "@/components/marketing/marketing-auth-context";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingAuthProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/40 text-slate-900">
        <Navbar />
        <div className="pb-16">{children}</div>
        <MarketingFooter />
      </div>
    </MarketingAuthProvider>
  );
}
