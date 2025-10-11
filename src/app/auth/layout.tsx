export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <main className="flex flex-1 items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">{children}</div>
      </main>
    </div>
  )
}
