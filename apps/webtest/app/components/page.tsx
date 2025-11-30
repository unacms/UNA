// Components Showcase - Server Component using HeroUI v3
// Demonstrates available HeroUI components

import { Button, Card, CardContent, CardTitle, CardDescription, Chip, Separator } from "@neo/test-components"
import Link from "next/link"

export const metadata = {
  title: 'Components | NEO Testground',
  description: 'Explore HeroUI v3 components available in NEO.',
}

const components = [
  {
    name: 'Button',
    description: 'Interactive button with multiple variants and sizes',
    href: '/components/button',
  },
  {
    name: 'Dialog',
    description: 'Modal dialog for important content',
    href: '/components/dialog',
  },
  {
    name: 'Tabs',
    description: 'Tabbed content sections',
    href: '/components/tabs',
  },
  {
    name: 'Tooltip',
    description: 'Contextual information on hover',
    href: '/components/tooltip',
  },
]

export default function ComponentsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="text-center mb-16">
        <Chip className="bg-primary/10 text-primary mb-6">
          HeroUI v3 Components
        </Chip>
        <h1 className="text-4xl font-bold mb-4">Components</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore HeroUI v3 components built with React Aria for accessibility
          and Tailwind CSS v4 for styling.
        </p>
      </section>

      {/* Button Preview */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Button Variants</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12" />

      {/* Chip Preview */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Chips</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Chip className="bg-primary/10 text-primary">Primary</Chip>
              <Chip>Default</Chip>
              <Chip className="bg-green-500/10 text-green-600">Success</Chip>
              <Chip className="bg-amber-500/10 text-amber-600">Warning</Chip>
              <Chip className="bg-red-500/10 text-red-600">Error</Chip>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12" />

      {/* Card Preview */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Cards</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <CardTitle>Basic Card</CardTitle>
              <CardDescription>A simple card with title and description.</CardDescription>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <CardTitle>Hover Effect</CardTitle>
              <CardDescription>This card has a hover shadow effect.</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-primary">
            <CardContent className="p-6">
              <CardTitle>Highlighted</CardTitle>
              <CardDescription>A card with primary border highlight.</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Component Links */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">All Components</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {components.map((component) => (
            <Link key={component.name} href={component.href} className="block">
              <Card className="h-full hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                  <CardTitle>{component.name}</CardTitle>
                  <CardDescription>{component.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This page is a <strong>Server Component</strong> — HeroUI is RSC-compatible.
      </p>
    </div>
  )
}
