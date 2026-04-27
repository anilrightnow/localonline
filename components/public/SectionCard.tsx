import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={`pub-card${className ? ` ${className}` : ""}`}>
      {title ? <h2 className="pub-card-title">{title}</h2> : null}
      {children}
    </section>
  );
}
