type Insight = { id: string; text: string };

type Props = {
  title?: string;
  insights: Insight[];
  theme?: "dark" | "light";
};

export function NexaInsightsPanel({
  title = "Nexa Insights",
  insights,
  theme = "light",
}: Props) {
  if (!insights.length) return null;

  const isDark = theme === "dark";

  return (
    <section
      className={`rounded-2xl border p-4 ${
        isDark
          ? "border-cyan-500/25 bg-cyan-950/20 shadow-[0_0_40px_-12px_rgba(34,211,238,0.25)]"
          : "border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-white shadow-sm"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
          isDark ? "text-cyan-300/90" : "text-cyan-700"
        }`}
      >
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {insights.map((item) => (
          <li
            key={item.id}
            className={`flex gap-2 text-sm leading-snug ${isDark ? "text-zinc-200" : "text-slate-700"}`}
          >
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isDark ? "bg-cyan-400" : "bg-cyan-500"}`} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
