"use client";

type Action = { label: string; prompt: string };

type Props = {
  actions: Action[];
  onSelect: (prompt: string) => void;
  theme?: "dark" | "light";
};

export function NexaSmartActions({ actions, onSelect, theme = "light" }: Props) {
  const isDark = theme === "dark";

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={() => onSelect(a.prompt)}
          className={`rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition ${
            isDark
              ? "border-white/15 bg-white/5 text-zinc-200 hover:border-cyan-500/40 hover:bg-cyan-500/10"
              : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-cyan-300 hover:bg-cyan-50/80"
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
