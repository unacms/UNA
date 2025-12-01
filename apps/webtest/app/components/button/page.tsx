// Button Component Page - Server Component
// Demonstrates Button from @neo/test-components (wraps HeroUI v3)

import { Button, Card, CardContent, Separator } from "@neo/test-components"
import { 
  Settings, 
  Bell, 
  Trash2, 
  Plus, 
  Download, 
  Send, 
  Heart, 
  Share2,
  ChevronRight,
  Search,
  Mail,
  Save,
  Loader2,
} from "lucide-react"

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
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" isDisabled>
                  Disabled
                </Button>
                <Button variant="secondary" isDisabled>
                  <Save className="w-4 h-4" />
                  Disabled
                </Button>
                <Button variant="tertiary" isDisabled isIconOnly>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" isPending>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading
                </Button>
                <Button variant="secondary" isPending>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* With Icons */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">With Icons</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Icons from <code className="px-1.5 py-0.5 bg-muted rounded text-xs">lucide-react</code> — 
                server-component compatible. Spacing handled via <code className="px-1.5 py-0.5 bg-muted rounded text-xs">gap</code>.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary">
                  <Plus className="w-4 h-4" />
                  Create New
                </Button>
                <Button variant="secondary">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="tertiary">
                  <Send className="w-4 h-4" />
                  Send
                </Button>
                <Button variant="ghost">
                  <Heart className="w-4 h-4" />
                  Like
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="secondary">
                  <Mail className="w-4 h-4" />
                  Contact
                </Button>
                <Button variant="danger">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button variant="danger-soft">
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Icon Only */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Icon Only</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Compact buttons with only an icon — use <code className="px-1.5 py-0.5 bg-muted rounded text-xs">isIconOnly</code> prop
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" isIconOnly size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="primary" isIconOnly>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="primary" isIconOnly size="lg">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="secondary" isIconOnly size="sm">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="secondary" isIconOnly>
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="tertiary" isIconOnly>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" isIconOnly>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="danger" isIconOnly>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="danger-soft" isIconOnly>
                  <Trash2 className="w-4 h-4" />
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
// Lucide icons are SSR-compatible
import { Plus, Settings, Trash2 } from "lucide-react"

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

// With icons (gap handles spacing automatically)
<Button variant="primary">
  <Plus className="w-4 h-4" />
  Create New
</Button>

// Icon on right (no margin needed)
<Button variant="secondary">
  Continue
  <ChevronRight className="w-4 h-4" />
</Button>

// Icon only
<Button isIconOnly variant="tertiary">
  <Settings className="w-4 h-4" />
</Button>

// Disabled state
<Button isDisabled>Disabled</Button>

// Loading state (use animate-spin on icon)
<Button isPending>
  <Loader2 className="w-4 h-4 animate-spin" />
  Loading...
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
