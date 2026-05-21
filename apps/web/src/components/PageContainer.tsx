interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Contenedor centrado para las páginas del navbar.
 * max-w-5xl (1024px) con padding horizontal.
 * Igual al patrón que usa la mayoría de las apps modernas.
 */
export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`max-w-5xl mx-auto px-5 md:px-8 py-10 ${className}`}>
      {children}
    </div>
  );
}
