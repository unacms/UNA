// Home Page - Server Component using HeroUI v3
// HeroUI components are RSC-compatible (built on React Aria Components)

import { Button, Card, CardContent, CardTitle, CardDescription, Chip, Separator } from "@neo/test-components"
import Link from "next/link"
import { PageFooter } from "./components/page-footer"

export default function HomePage() {
  return (
    <>
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <Chip className="bg-primary/10 text-primary mb-6">
          HeroUI v3 + Next.js 16
        </Chip>
        <h1 className="text-5xl font-bold mb-6">
          Build Beautiful Apps
          <span className="block text-primary">Faster Than Ever</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          NEO Testground showcases HeroUI v3 components with Next.js 16 App Router,
          React 19, and full dark mode support.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary" size="lg" asChild>
            <Link href="/docs">Get Started</Link>
          </Button>
          <Button variant="tertiary" size="lg" asChild>
            <Link href="/components">View Components</Link>
          </Button>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Features */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why HeroUI v3?</h2>
          <p className="text-muted-foreground">
            Beautiful, accessible components built with Tailwind CSS v4 and React Aria
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="♿"
            title="Accessible"
            description="Built on React Aria Components for WAI-ARIA compliance and screen reader support."
          />
          <FeatureCard
            icon="🎨"
            title="Themeable"
            description="Customize with Tailwind utilities, CSS variables, or compose parts differently."
          />
          <FeatureCard
            icon="⚡"
            title="Lightweight"
            description="Tree-shaken. Only what you use goes into your app."
          />
          <FeatureCard
            icon="📘"
            title="TypeScript"
            description="Fully typed APIs with excellent autocomplete and IDE support."
          />
          <FeatureCard
            icon="🚀"
            title="Future-proof"
            description="Built for React 19 and Tailwind v4, designed for AI-assisted development."
          />
          <FeatureCard
            icon="📱"
            title="Cross-Platform"
            description="HeroUI Native brings the same design language to React Native."
          />
        </div>
      </section>

      <Separator className="my-12" />

      {/* Quick Links */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Explore</h2>
          <p className="text-muted-foreground">
            Test different UI patterns and component combinations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <LinkCard
            href="/components"
            title="Components"
            description="Buttons, cards, dialogs, and more"
          />
          <LinkCard
            href="/layouts"
            title="Layouts"
            description="Navigation patterns and page layouts"
          />
          <LinkCard
            href="/streaming"
            title="Streaming"
            description="Suspense boundaries and loading states"
          />
        </div>
      </section>

    </div>
    
    {/* Performance Report Footer - controlled by settings */}
    <PageFooter 
      pageName="Home"
      data={{ componentType: 'server' }}
    />
    </>
  )
}

// Pure function components - render as Server Components
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <span className="text-4xl mb-4 block">{icon}</span>
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function LinkCard({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}
