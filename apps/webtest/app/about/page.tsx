// About Page - Pure Server Component
// No client JavaScript - renders as static HTML

import Link from 'next/link'

export const metadata = {
  title: 'About | NEO Testground',
  description: 'Learn about the NEO platform and our mission.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About NEO</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Building the future of cross-platform applications with modern React patterns.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-muted-foreground mb-4">
          NEO is an experimental platform exploring the boundaries of what's possible with 
          React Server Components, Next.js 16, and cross-platform development using React Native.
        </p>
        <p className="text-muted-foreground">
          We believe in building applications that are fast by default, accessible to everyone, 
          and delightful to use across all devices.
        </p>
      </section>

      {/* Tech Stack */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Technology Stack</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <TechCard
            title="Next.js 16"
            description="App Router with Turbopack, Cache Components, and React Compiler"
          />
          <TechCard
            title="React 19"
            description="Server Components, Actions, and the latest React features"
          />
          <TechCard
            title="React Native + Expo"
            description="Cross-platform mobile development with shared components"
          />
          <TechCard
            title="Tailwind CSS 4"
            description="Utility-first styling with CSS variables for theming"
          />
        </div>
      </section>

      {/* Team */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">The Team</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <TeamMember name="Alex Chen" role="Lead Developer" />
          <TeamMember name="Sarah Kim" role="Design Systems" />
          <TeamMember name="Mike Johnson" role="Platform Engineering" />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 px-8 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-6">
          Explore our documentation and start building today.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/docs"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Read the Docs
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 border border-border rounded-md font-medium hover:bg-accent"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-sm text-muted-foreground mt-12">
        This page is a <strong>Server Component</strong> — zero client JavaScript.
      </p>
    </div>
  )
}

// Pure function components - no hooks, no client JS
function TechCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 border border-border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
        <span className="text-2xl">👤</span>
      </div>
      <h3 className="font-medium">{name}</h3>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
  )
}

