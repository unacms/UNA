// Layouts Demo - Server Component using HeroUI v3
// Demonstrates server-rendered navigation without client JS

import { Button, Card, CardContent, CardTitle, CardDescription, Chip, Separator } from "@heroui/react"
import { cacheLife } from 'next/cache'
import Link from 'next/link'

export const metadata = {
  title: 'Layouts | NEO Testground',
  description: 'Server-rendered navigation patterns and page layouts.',
}

export default async function LayoutsPage() {
  'use cache'
  cacheLife('max')

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← Back to Home</Link>
        </Button>
      </nav>

      <div className="text-center mb-12">
        <Chip className="bg-primary/10 text-primary mb-6">
          Layout Patterns
        </Chip>
        <h1 className="text-4xl font-bold mb-4">Layout Experiments</h1>
        <p className="text-xl text-muted-foreground">
          Server-rendered navigation patterns with zero client JavaScript for the shell.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LayoutCard
          href="/layouts/site-topnav"
          title="Site Top Nav"
          description="Public pages with horizontal navigation"
          badge="Available"
          badgeColor="green"
        />
        <LayoutCard
          href="#"
          title="Site Sidebar"
          description="Dashboard with vertical sidebar"
          badge="Coming Soon"
          badgeColor="amber"
          disabled
        />
        <LayoutCard
          href="#"
          title="App Top Nav"
          description="App interface with compact header"
          badge="Coming Soon"
          badgeColor="amber"
          disabled
        />
        <LayoutCard
          href="#"
          title="App Sidebar"
          description="Social app with icon sidebar"
          badge="Coming Soon"
          badgeColor="amber"
          disabled
        />
      </div>

      <Separator className="my-12" />

      <section className="p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Server Component Benefits</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Zero JS</strong> - Navigation renders as pure HTML</li>
          <li>• <strong>Instant</strong> - Part of static shell, no hydration</li>
          <li>• <strong>Cached</strong> - Reused across requests with <code className="bg-muted px-1 rounded">use cache</code></li>
          <li>• <strong>SEO</strong> - Full HTML in initial response</li>
        </ul>
      </section>

      <p className="text-center text-sm text-muted-foreground mt-12">
        This page is a <strong>Server Component</strong> — HeroUI is RSC-compatible.
      </p>
    </div>
  )
}

// Pure server component - renders to static HTML
function LayoutCard({
  href,
  title,
  description,
  badge,
  badgeColor,
  disabled = false,
}: {
  href: string
  title: string
  description: string
  badge: string
  badgeColor: 'amber' | 'green' | 'blue'
  disabled?: boolean
}) {
  const badgeClasses = {
    amber: 'bg-amber-500/10 text-amber-600',
    green: 'bg-green-500/10 text-green-600',
    blue: 'bg-blue-500/10 text-blue-600',
  }

  const content = (
    <Card className={`h-full ${disabled ? 'opacity-60' : 'hover:bg-accent/50'} transition-colors`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <CardTitle>{title}</CardTitle>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeClasses[badgeColor]}`}>
            {badge}
          </span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )

  if (disabled) {
    return <div className="cursor-not-allowed">{content}</div>
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}
