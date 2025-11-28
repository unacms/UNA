// Home Page - Server Component with caching
import { cacheLife } from 'next/cache'
import Link from 'next/link'
import { Button } from '@neo/test-components'

// This entire component is cached and part of the static shell
export default async function Home() {
  'use cache'
  cacheLife('hours')

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">NEO Webtest</h1>
        <p className="text-lg text-muted-foreground">
          Next.js 16 + Turbopack + Cache Components + React Compiler
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Architecture</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>✓ Server Components by default</li>
          <li>✓ <code className="bg-muted px-1 rounded">use cache</code> for cacheable content</li>
          <li>✓ React Compiler enabled</li>
          <li>✓ Tailwind CSS 4</li>
          <li>✓ Shared @neo/test-components package</li>
        </ul>
      </section>

      {/* Shared Button Component Demo */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Shared Button Component
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Same Button component used in nativetest (Expo), rendered with Tailwind CSS
        </p>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Experiments</h2>
        <nav className="grid gap-4 sm:grid-cols-2">
          <ExperimentCard
            href="/layouts"
            title="Layouts"
            description="Server-rendered navigation layouts"
          />
          <ExperimentCard
            href="/streaming"
            title="Streaming"
            description="Suspense boundaries and loading states"
          />
          <ExperimentCard
            href="/components"
            title="Components"
            description="Server vs client component patterns"
          />
        </nav>
      </section>

      <footer className="text-sm text-muted-foreground border-t border-border pt-8">
        <p>Running on port 3001 • Isolated from main app</p>
        <p className="mt-1">
          <code className="bg-muted px-1 rounded">cacheComponents: true</code> •{' '}
          <code className="bg-muted px-1 rounded">reactCompiler: true</code>
        </p>
      </footer>
    </main>
  )
}

// Pure server component - no client JS needed
function ExperimentCard({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="block p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
    >
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}
