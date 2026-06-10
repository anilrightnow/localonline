import type { ReactNode } from "react";

type SectionCardProps = {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  id,
  title,
  children,
  className,
}: SectionCardProps) {
  return (
    <section id={id} className={`pub-card${className ? ` ${className}` : ""}`}>
      {title ? <h2 className="pub-card-title">{title}</h2> : null}
      {children}
    </section>
  );
}
