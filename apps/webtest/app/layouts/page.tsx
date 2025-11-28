// Layouts Demo - Server Component
// Demonstrates server-rendered navigation without client JS

import { cacheLife } from 'next/cache'
import Link from 'next/link'

export default async function LayoutsPage() {
  'use cache'
  cacheLife('max')

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <nav className="mb-8">
        <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
      </nav>

      <h1 className="text-3xl font-bold mb-4">Layout Experiments</h1>
      <p className="text-muted-foreground mb-8">
        Server-rendered navigation patterns with zero client JavaScript for the shell.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <LayoutCard
          href="/layouts/site-topnav"
          title="Site Top Nav"
          description="Public pages with horizontal navigation"
          badge="Unauthenticated"
          badgeColor="amber"
        />
        <LayoutCard
          href="/layouts/site-sidebar"
          title="Site Sidebar"
          description="Dashboard with vertical sidebar"
          badge="Authenticated"
          badgeColor="green"
        />
        <LayoutCard
          href="/layouts/app-topnav"
          title="App Top Nav"
          description="App interface with compact header"
          badge="Authenticated"
          badgeColor="green"
        />
        <LayoutCard
          href="/layouts/app-sidebar"
          title="App Sidebar"
          description="Social app with icon sidebar"
          badge="Authenticated"
          badgeColor="green"
        />
      </div>

      <section className="mt-12 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Server Component Benefits</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Zero JS</strong> - Navigation renders as pure HTML</li>
          <li>• <strong>Instant</strong> - Part of static shell, no hydration</li>
          <li>• <strong>Cached</strong> - Reused across requests with <code>use cache</code></li>
          <li>• <strong>SEO</strong> - Full HTML in initial response</li>
        </ul>
      </section>
    </main>
  )
}

// Pure server component - renders to static HTML
function LayoutCard({
  href,
  title,
  description,
  badge,
  badgeColor,
}: {
  href: string
  title: string
  description: string
  badge: string
  badgeColor: 'amber' | 'green' | 'blue'
}) {
  const badgeClasses = {
    amber: 'bg-amber-500/10 text-amber-600',
    green: 'bg-green-500/10 text-green-600',
    blue: 'bg-blue-500/10 text-blue-600',
  }

  return (
    <Link
      href={href}
      className="block p-6 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded ${badgeClasses[badgeColor]}`}>
          {badge}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}


