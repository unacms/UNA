// Site Top Nav Layout - Pure Server Component
// Uses the root layout navigation, just adds a footer

export default function SiteTopNavLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © 2025 NEO. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
