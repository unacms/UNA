// Components Demo - Server vs Client patterns
import { Suspense } from 'react'
import { cacheLife } from 'next/cache'
import Link from 'next/link'

export default async function ComponentsPage() {
  'use cache'
  cacheLife('max')

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <nav className="mb-8">
        <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
      </nav>

      <h1 className="text-3xl font-bold mb-4">Component Patterns</h1>
      <p className="text-muted-foreground mb-8">
        Demonstrating when to use Server vs Client components following Next.js 16 best practices.
      </p>

      {/* Server Component Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-green-600 dark:text-green-400">
          ✓ Server Components (Default)
        </h2>

        <div className="space-y-4">
          <ComponentExample
            title="Static Content"
            description="Text, headings, static UI - no JS needed"
            code={`function Hero() {
  return (
    <section>
      <h1>Welcome</h1>
      <p>Static content...</p>
    </section>
  )
}`}
            badge="Zero JS"
          />

          <ComponentExample
            title="Data Fetching"
            description="Async server components with 'use cache'"
            code={`async function Posts() {
  'use cache'
  const posts = await db.query(...)
  return <ul>{posts.map(...)}</ul>
}`}
            badge="Cached"
          />

          <ComponentExample
            title="Navigation"
            description="Links and nav rendered as pure HTML"
            code={`function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
    </nav>
  )
}`}
            badge="HTML only"
          />

          <ComponentExample
            title="Icons (Server-safe)"
            description="Use inline SVG or emoji instead of Icon component"
            code={`function FeatureCard() {
  return (
    <div>
      <span>🚀</span> {/* or inline SVG */}
      <h3>Feature</h3>
    </div>
  )
}`}
            badge="No hydration"
          />
        </div>
      </section>

      {/* Client Component Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-amber-600 dark:text-amber-400">
          ⚡ Client Components (Opt-in)
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Only use when you need: useState, useEffect, browser APIs, or gesture-based UX
        </p>

        <div className="space-y-4">
          <ComponentExample
            title="Interactive Forms"
            description="useState for form state management"
            code={`'use client'

function SearchBox() {
  const [query, setQuery] = useState('')
  return <input onChange={e => setQuery(e.target.value)} />
}`}
            badge="useState"
          />

          <ComponentExample
            title="Theme Toggle"
            description="Browser localStorage + state"
            code={`'use client'

function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme')
  )
  // ...
}`}
            badge="Browser API"
          />

          <ComponentExample
            title="Animations"
            description="Motion/gesture libraries need client"
            code={`'use client'

function AnimatedCard() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
    >
      ...
    </motion.div>
  )
}`}
            badge="Animation"
          />
        </div>
      </section>

      {/* Pattern: Composition */}
      <section className="p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Best Pattern: Composition</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Keep server components as the shell, pass client components as children:
        </p>
        <pre className="bg-card p-4 rounded-lg text-sm overflow-x-auto">
{`// page.tsx (Server Component)
export default function Page() {
  return (
    <article>
      <h1>Article Title</h1>       {/* Server */}
      <p>Content...</p>            {/* Server */}
      <LikeButton />               {/* Client - only this hydrates */}
      <CommentSection />           {/* Client */}
    </article>
  )
}`}
        </pre>
      </section>
    </main>
  )
}

function ComponentExample({
  title,
  description,
  code,
  badge,
}: {
  title: string
  description: string
  code: string
  badge: string
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="p-4 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-xs px-2 py-0.5 bg-muted rounded">{badge}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <pre className="p-4 bg-muted/30 text-sm overflow-x-auto border-t border-border">
        <code>{code}</code>
      </pre>
    </div>
  )
}


