// Streaming Demo - Server Component with Suspense
// Demonstrates partial prerendering with streaming dynamic content

import { Suspense } from 'react'
import { cacheLife } from 'next/cache'
import Link from 'next/link'

export default async function StreamingPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <nav className="mb-8">
        <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
      </nav>

      <h1 className="text-3xl font-bold mb-4">Streaming & Suspense Demo</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates partial prerendering with streaming dynamic content.
        Static content appears instantly, dynamic content streams in.
      </p>

      {/* Static content - part of the shell */}
      <section className="mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-green-700 dark:text-green-400">
          ✓ Static Shell (Instant)
        </h2>
        <p className="text-sm text-muted-foreground">
          This content is part of the static shell. It's prerendered and sent immediately.
        </p>
      </section>

      {/* Cached dynamic content */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cached Content</h2>
        <Suspense fallback={<LoadingSkeleton />}>
          <CachedPosts />
        </Suspense>
      </section>

      {/* Streaming dynamic content */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Streaming Content (2s delay)</h2>
        <Suspense fallback={<LoadingSkeleton />}>
          <SlowContent delay={2000} />
        </Suspense>
      </section>

      {/* Another streaming section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">More Streaming (3s delay)</h2>
        <Suspense fallback={<LoadingSkeleton />}>
          <SlowContent delay={3000} />
        </Suspense>
      </section>

      {/* Info */}
      <section className="p-6 bg-muted/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How it works</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>1. Static shell is sent immediately (this text, navigation, headers)</li>
          <li>2. Cached content streams in (included in shell if pre-cached)</li>
          <li>3. Dynamic content streams as it becomes ready</li>
          <li>4. Each Suspense boundary streams independently</li>
        </ul>
      </section>
    </main>
  )
}

// Cached server component
async function CachedPosts() {
  'use cache'
  cacheLife('hours')

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100))

  return (
    <div className="p-6 border border-border rounded-lg bg-card">
      <p className="text-sm text-muted-foreground mb-3">
        ✓ Cached with <code className="bg-muted px-1 rounded">use cache</code> - reused across requests
      </p>
      <ul className="space-y-2">
        <li className="p-3 bg-muted/50 rounded">Post 1: Introduction to Server Components</li>
        <li className="p-3 bg-muted/50 rounded">Post 2: Understanding Cache Components</li>
        <li className="p-3 bg-muted/50 rounded">Post 3: Streaming with Suspense</li>
      </ul>
    </div>
  )
}

// Slow async component - simulates DB query or API call
async function SlowContent({ delay }: { delay: number }) {
  await new Promise((resolve) => setTimeout(resolve, delay))

  return (
    <div className="p-6 border border-border rounded-lg bg-card">
      <p className="text-sm text-muted-foreground mb-2">
        ✓ Loaded after {delay}ms delay
      </p>
      <p className="text-sm">
        This content was fetched asynchronously and streamed to the client.
        The page was interactive before this appeared!
      </p>
    </div>
  )
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="p-6 border border-border rounded-lg bg-card animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    </div>
  )
}







