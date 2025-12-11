// GlassyButton Component Page - Server Component wrapper
// Demonstrates GlassyButton from @neo/test-components

import { Card, CardContent, Separator } from "@neo/test-components"
import { GlassyButtonDemo } from "./glassy-button-demo"

export const metadata = {
  title: "GlassyButton | NEO Testground",
  description: "A button with live camera feed as background for a unique reflection effect.",
}

export default function GlassyButtonComponentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">GlassyButton</h1>
      <p className="text-xl text-muted-foreground mb-4">
        A unique button component that uses your device camera as the background,
        creating a "reflection" or "mirror" effect.
      </p>
      <p className="text-sm text-muted-foreground mb-12 p-3 bg-muted rounded-lg">
        <strong>Note:</strong> This component requires camera access. The camera feed starts 
        when you hover over the button. Grant camera permission to see the full effect.
      </p>

      {/* Client component with interactive demos */}
      <GlassyButtonDemo />

      <Separator className="my-12" />

      {/* Usage */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Usage</h2>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="font-mono text-sm overflow-x-auto">
{`// Import from shared component library
import { GlassyButton } from "@neo/test-components"
import { Camera, Sparkles } from "lucide-react"

// Basic usage
<GlassyButton>Click me</GlassyButton>

// Variants (affect overlay color)
<GlassyButton variant="default">Default</GlassyButton>
<GlassyButton variant="primary">Primary</GlassyButton>
<GlassyButton variant="secondary">Secondary</GlassyButton>
<GlassyButton variant="dark">Dark</GlassyButton>
<GlassyButton variant="light">Light</GlassyButton>

// Sizes
<GlassyButton size="sm">Small</GlassyButton>
<GlassyButton size="md">Medium</GlassyButton>
<GlassyButton size="lg">Large</GlassyButton>

// With blur effect
<GlassyButton blur="none">No blur</GlassyButton>
<GlassyButton blur="sm">Slight blur</GlassyButton>
<GlassyButton blur="md">Medium blur</GlassyButton>
<GlassyButton blur="lg">Heavy blur</GlassyButton>

// Mirror mode (default: true)
<GlassyButton mirror={true}>Selfie mode</GlassyButton>
<GlassyButton mirror={false}>Regular</GlassyButton>

// Overlay opacity (0-1)
<GlassyButton overlayOpacity={0.2}>More transparent</GlassyButton>
<GlassyButton overlayOpacity={0.6}>More opaque</GlassyButton>

// With icons
<GlassyButton>
  <Camera className="w-4 h-4" />
  Take Photo
</GlassyButton>

// Icon only
<GlassyButton isIconOnly>
  <Sparkles className="w-4 h-4" />
</GlassyButton>`}
          </pre>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Props */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Props</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Prop</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Default</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4 font-mono text-xs">variant</td>
                  <td className="p-4 font-mono text-xs">"default" | "primary" | "secondary" | "dark" | "light"</td>
                  <td className="p-4 font-mono text-xs">"default"</td>
                  <td className="p-4">Visual variant - affects overlay color</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-xs">size</td>
                  <td className="p-4 font-mono text-xs">"sm" | "md" | "lg"</td>
                  <td className="p-4 font-mono text-xs">"md"</td>
                  <td className="p-4">Button size</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-xs">blur</td>
                  <td className="p-4 font-mono text-xs">"none" | "sm" | "md" | "lg"</td>
                  <td className="p-4 font-mono text-xs">"none"</td>
                  <td className="p-4">Blur amount for the video background</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-xs">mirror</td>
                  <td className="p-4 font-mono text-xs">boolean</td>
                  <td className="p-4 font-mono text-xs">true</td>
                  <td className="p-4">Mirror the video (selfie mode)</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-xs">overlayOpacity</td>
                  <td className="p-4 font-mono text-xs">number (0-1)</td>
                  <td className="p-4 font-mono text-xs">0.3</td>
                  <td className="p-4">Opacity of the glass overlay</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-xs">isIconOnly</td>
                  <td className="p-4 font-mono text-xs">boolean</td>
                  <td className="p-4 font-mono text-xs">false</td>
                  <td className="p-4">Icon-only button (square)</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-xs">isDisabled</td>
                  <td className="p-4 font-mono text-xs">boolean</td>
                  <td className="p-4 font-mono text-xs">false</td>
                  <td className="p-4">Disabled state</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        <strong>GlassyButton</strong> is a <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-sm">Client Component</code>
        because it requires camera access via <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-sm">getUserMedia()</code>.
      </p>
    </div>
  )
}
