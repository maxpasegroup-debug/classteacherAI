"use client";

import type { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  roles: UserRole[];
  activeRole: UserRole;
};

export function RoleSwitcher({ roles, activeRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const missing: UserRole | null = !roles.includes("TEACHER")
    ? "TEACHER"
    : !roles.includes("STUDENT")
      ? "STUDENT"
      : null;

  async function switchTo(newRole: UserRole) {
    if (newRole === activeRole) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeRole: newRole }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? "Could not switch role.");
        return;
      }
      router.refresh();
      router.push(newRole === "TEACHER" ? "/teacher/dashboard" : "/student/today");
    } finally {
      setLoading(false);
    }
  }

  async function addRole(role: UserRole) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/add-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? "Could not add role.");
        return;
      }
      await switchTo(role);
    } finally {
      setLoading(false);
    }
  }

  if (roles.length >= 2) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-500">Switch role</label>
        <select
          disabled={loading}
          value={activeRole}
          onChange={(e) => void switchTo(e.target.value as UserRole)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r === "TEACHER" ? "Teacher" : "Student"}
            </option>
          ))}
        </select>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    );
  }

  if (missing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void addRole(missing)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Add {missing === "TEACHER" ? "Teacher" : "Student"} access
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    );
  }

  return null;
}
