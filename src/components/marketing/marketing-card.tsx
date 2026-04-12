type Props = {
  className?: string;
  children: React.ReactNode;
  highlighted?: boolean;
};

export function MarketingCard({ className = "", children, highlighted }: Props) {
  return (
    <div
      className={`rounded-3xl border bg-white/90 p-6 shadow-[0_2px_24px_-4px_rgba(15,23,42,0.08)] backdrop-blur-sm transition hover:shadow-[0_8px_32px_-6px_rgba(15,23,42,0.12)] ${
        highlighted
          ? "border-sky-200/80 ring-2 ring-sky-100/80"
          : "border-slate-200/70 hover:border-slate-300/80"
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
