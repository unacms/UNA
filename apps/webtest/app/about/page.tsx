// About Page - Server Component using HeroUI v3

import { Button, Card, CardContent, CardTitle, CardDescription, Separator } from "@neo/test-components"
import Link from "next/link"

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

      <Separator className="my-12" />

      {/* Tech Stack */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Technology Stack</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <CardTitle>Next.js 16</CardTitle>
              <CardDescription>App Router with Turbopack, Cache Components, and React Compiler</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>React 19</CardTitle>
              <CardDescription>Server Components, Actions, and the latest React features</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>HeroUI v3</CardTitle>
              <CardDescription>Beautiful, accessible components with React Aria and Tailwind CSS v4</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardTitle>React Native + Expo</CardTitle>
              <CardDescription>Cross-platform mobile development with shared components</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Team */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">The Team</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <TeamMember name="Alex Chen" role="Lead Developer" />
          <TeamMember name="Sarah Kim" role="Design Systems" />
          <TeamMember name="Mike Johnson" role="Platform Engineering" />
        </div>
      </section>

      <Separator className="my-12" />

      {/* CTA */}
      <section className="text-center py-12 px-8 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-6">
          Explore our documentation and start building today.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary" size="lg" asChild>
            <Link href="/docs">Read the Docs</Link>
          </Button>
          <Button variant="tertiary" size="lg" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-sm text-muted-foreground mt-12">
        This page is a <strong>Server Component</strong> — HeroUI is RSC-compatible.
      </p>
    </div>
  )
}

// Pure function component
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
