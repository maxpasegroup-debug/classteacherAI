import { MainAppShell } from "@/components/main-app-shell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainAppShell>{children}</MainAppShell>;
}
