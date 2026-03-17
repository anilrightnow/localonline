import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  children: ReactNode;
};

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="pub-card">
      {title ? <h2 className="pub-card-title">{title}</h2> : null}
      {children}
    </section>
  );
}

