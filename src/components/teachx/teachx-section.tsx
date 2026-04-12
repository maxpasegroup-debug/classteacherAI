import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function TeachXSection({ id, eyebrow, title, description, children, className = "" }: Props) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600/90">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{description}</p> : null}
      {children ? <div className="mt-10">{children}</div> : null}
    </section>
  );
}
