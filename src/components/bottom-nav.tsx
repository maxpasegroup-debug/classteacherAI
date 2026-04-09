"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/today", label: "Today", icon: "T" },
  { href: "/nexa", label: "Nexa AI", icon: "N", center: true },
  { href: "/classes", label: "Classes", icon: "C" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white/95 px-4 pb-4 pt-2 backdrop-blur">
      <div className="mx-auto grid w-full max-w-md grid-cols-3 items-end gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          if (item.center) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center">
                <span
                  className={`mb-1 flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold text-white transition ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-emerald-500 shadow-[0_0_0_8px_rgba(59,130,246,0.15),0_14px_30px_-10px_rgba(16,185,129,0.7)]"
                      : "bg-gradient-to-r from-blue-500 to-emerald-400 shadow-[0_0_0_6px_rgba(59,130,246,0.12)]"
                  }`}
                >
                  {item.icon}
                </span>
                <span className={`text-xs font-medium ${active ? "text-slate-900" : "text-slate-500"}`}>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center pb-1 pt-2">
              <span
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-xs font-medium ${active ? "text-slate-900" : "text-slate-500"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
