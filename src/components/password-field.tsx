"use client";

import { useId, useState } from "react";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  className?: string;
  disabled?: boolean;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  className,
  disabled,
}: Props) {
  const genId = useId();
  const inputId = id ?? genId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-14 text-sm outline-none focus:border-blue-400 disabled:opacity-60"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
