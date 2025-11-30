// Button Component Page - Server Component
// Demonstrates Button from @neo/test-components (wraps HeroUI v3)

import { Button, Card, CardContent, Separator, Spinner } from "@neo/test-components"

export const metadata = {
  title: "Button | NEO Testground",
  description: "Interactive button component with variants.",
}

export default function ButtonComponentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Button</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Interactive button component with multiple variants and sizes.
        Built on HeroUI v3 with BEM theming.
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
                <Button variant="danger-soft">Danger Soft</Button>
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
                <Button variant="primary" isDisabled>
                  Disabled
                </Button>
                <Button variant="primary" isPending>
                  <Spinner size="sm" className="mr-2" />
                  Loading
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Icon Only */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Icon Only</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="tertiary" isIconOnly size="sm">
                  ⚙️
                </Button>
                <Button variant="secondary" isIconOnly>
                  🔔
                </Button>
                <Button variant="danger" isIconOnly size="lg">
                  🗑️
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
{`// Import from shared component library
import { Button } from "@neo/test-components"

// Primary button (default)
<Button>Click me</Button>

// Button variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="danger-soft">Danger Soft</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  {/* default */}
<Button size="lg">Large</Button>

// Disabled state
<Button isDisabled>Disabled</Button>

// Loading state
<Button isPending>
  <Spinner size="sm" />
  Loading...
</Button>

// Icon only
<Button isIconOnly variant="tertiary">
  ⚙️
</Button>`}
            </pre>
          </div>
        </section>

        <Separator />

        {/* BEM Theming */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">BEM Theming</h2>
          <p className="text-muted-foreground mb-4">
            Buttons use BEM classes for styling, making them easy to customize via CSS:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="font-mono text-sm overflow-x-auto">
{`/* globals.css - customize button styles */
@layer components {
  .button { /* base styles */ }
  .button--sm { /* small size */ }
  .button--md { /* medium size */ }
  .button--lg { /* large size */ }
  .button--primary { /* primary variant */ }
  .button--secondary { /* secondary variant */ }
  .button--tertiary { /* tertiary variant */ }
  .button--ghost { /* ghost variant */ }
  .button--danger { /* danger variant */ }
  .button--icon-only { /* icon only */ }
}`}
            </pre>
          </div>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This page is a <strong>Server Component</strong> — components from 
        <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-sm">@neo/test-components</code>
        are RSC-compatible.
      </p>
    </div>
  )
}
