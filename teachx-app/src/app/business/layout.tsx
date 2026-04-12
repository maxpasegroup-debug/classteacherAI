import type { ReactNode } from "react";
import { BusinessDashboardShell } from "@/components/teachx/business/business-dashboard-shell";
import { TeachXBusinessNexa } from "@/components/teachx/teachx-business-nexa";
import { requireTeachxBusinessUser } from "@/lib/teachx-business-gate";

export default async function TeachXBusinessLayout({ children }: { children: ReactNode }) {
  const user = await requireTeachxBusinessUser();
  return (
    <BusinessDashboardShell userName={user.name}>
      {children}
      <TeachXBusinessNexa />
    </BusinessDashboardShell>
  );
}
