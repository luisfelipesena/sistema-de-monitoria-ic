interface PagesLayoutProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PagesLayout({ title, subtitle, actions, children }: PagesLayoutProps) {
  return (
    <div className="w-full max-w-full py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:flex-shrink-0">{actions}</div>
        )}
      </div>

      <div className="w-full overflow-hidden">{children}</div>
    </div>
  )
}
