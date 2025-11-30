// Tooltip Component Page - Server Component using HeroUI v3
// Note: Interactive tooltip would require client component

import { Button, Card, CardContent, Separator } from "@heroui/react"

export const metadata = {
  title: 'Tooltip | NEO Testground',
  description: 'A popup that displays information on hover.',
}

export default function TooltipComponentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Tooltip</h1>
      <p className="text-xl text-muted-foreground mb-12">
        A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
      </p>

      <div className="space-y-12">
        {/* Preview */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Preview</h2>
          <Card>
            <CardContent className="p-6">
              {/* Static tooltip preview */}
              <div className="flex flex-col items-center gap-8">
                <div className="relative inline-block">
                  <Button variant="primary">Hover me</Button>
                  {/* Static tooltip shown */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-md whitespace-nowrap">
                    This is a tooltip
                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Positions */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Positions</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {['Top', 'Right', 'Bottom', 'Left'].map((position) => (
                  <div key={position} className="text-center p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{position}</span>
                  </div>
                ))}
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
{`"use client"

import { Tooltip, TooltipTrigger, TooltipContent } from "@heroui/react"

export function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button>Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        This is a tooltip
      </TooltipContent>
    </Tooltip>
  )
}

// With placement
<Tooltip placement="right">
  <TooltipTrigger>
    <Button>Right tooltip</Button>
  </TooltipTrigger>
  <TooltipContent>
    Appears on the right
  </TooltipContent>
</Tooltip>`}
            </pre>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: Tooltip requires a client component for interactivity.
          </p>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> showing a static preview.
      </p>
    </div>
  )
}
