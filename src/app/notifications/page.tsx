"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, InlineNotice, LoadingState } from "@/components/ui-states";

type Notif = { id: string; title: string; message: string; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as Notif[];
        setItems(parsed);
        setLoading(false);
        setError("");
      } catch {
        setError("Could not parse notification feed.");
        setLoading(false);
      }
    };
    source.onerror = () => {
      setError("Live notification stream disconnected.");
      setLoading(false);
    };
    return () => source.close();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-3xl space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <InlineNotice tone="info">Live updates are enabled. New notifications appear automatically.</InlineNotice>
        {loading ? <LoadingState label="Connecting to your notifications…" /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            detail="You're all caught up. Updates from exams, study help, and billing will appear here."
          />
        ) : null}
        {items.map((item) => (
          <article key={item.id} className="animate-fade-in-up rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <p className="mt-1 text-sm text-slate-600">{item.message}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
