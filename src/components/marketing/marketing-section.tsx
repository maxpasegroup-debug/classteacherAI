type Props = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

export function MarketingSection({ id, className = "", children }: Props) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`.trim()}>
      {children}
    </section>
  );
}
