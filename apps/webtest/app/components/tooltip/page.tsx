// Tooltip Component Page - Pure Server Component

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
          <div className="p-6 border border-border rounded-lg">
            {/* Static tooltip preview */}
            <div className="flex flex-col items-center gap-8">
              <div className="relative inline-block">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
                  Hover me
                </button>
                {/* Static tooltip shown */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-md whitespace-nowrap">
                  This is a tooltip
                  <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-foreground" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Positions */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Positions</h2>
          <div className="grid grid-cols-2 gap-4 p-6 border border-border rounded-lg">
            {['Top', 'Right', 'Bottom', 'Left'].map((position) => (
              <div key={position} className="text-center p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">{position}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Usage */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Usage</h2>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="font-mono text-sm overflow-x-auto">
{`import { Tooltip } from '@base-ui/tooltip'

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      Hover me
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner>
        <Tooltip.Popup>
          Tooltip content
          <Tooltip.Arrow />
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>`}
            </pre>
          </div>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> for testing purposes.
      </p>
    </div>
  )
}

