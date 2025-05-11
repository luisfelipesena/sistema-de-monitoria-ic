import { ReactNode } from 'react';

type PagesLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PagesLayout({
  title,
  subtitle,
  actions,
  children,
}: PagesLayoutProps) {
  return (
    <div className="container mx-auto py-2 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {children}
    </div>
  );
}
