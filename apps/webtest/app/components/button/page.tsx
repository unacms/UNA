// Button Component Page - Server Component using HeroUI v3

import { Button, Card, CardContent, Separator } from "@heroui/react"

export const metadata = {
  title: 'Button | NEO Testground',
  description: 'Interactive button component with variants.',
}

export default function ButtonComponentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Button</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Interactive button component with multiple variants and sizes.
      </p>

      <div className="space-y-12">
        {/* Variants */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Variants</h2>
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

        {/* Sizes */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Sizes</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" variant="primary">Small</Button>
                <Button size="md" variant="primary">Medium</Button>
                <Button size="lg" variant="primary">Large</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* States */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">States</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" className="opacity-50 cursor-not-allowed">
                  Disabled
                </Button>
                <Button variant="primary">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Loading
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Usage */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Usage</h2>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="font-mono text-sm overflow-x-auto">
{`import { Button } from "@heroui/react"

// Primary button
<Button variant="primary">Click me</Button>

// Button variants
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Button as link (using asChild)
<Button asChild>
  <Link href="/docs">Go to Docs</Link>
</Button>`}
            </pre>
          </div>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This page is a <strong>Server Component</strong> — HeroUI is RSC-compatible.
      </p>
    </div>
  )
}
