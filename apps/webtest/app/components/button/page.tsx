// Button Component Page - Pure Server Component

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
          <div className="flex flex-wrap gap-4 p-6 border border-border rounded-lg">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90">
              Primary
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80">
              Secondary
            </button>
            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium hover:bg-destructive/90">
              Destructive
            </button>
            <button className="px-4 py-2 border border-input bg-background rounded-md font-medium hover:bg-accent">
              Outline
            </button>
            <button className="px-4 py-2 rounded-md font-medium hover:bg-accent">
              Ghost
            </button>
          </div>
        </section>

        {/* Sizes */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Sizes</h2>
          <div className="flex flex-wrap items-center gap-4 p-6 border border-border rounded-lg">
            <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md font-medium">
              Small
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
              Medium
            </button>
            <button className="px-6 py-3 text-lg bg-primary text-primary-foreground rounded-md font-medium">
              Large
            </button>
          </div>
        </section>

        {/* States */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">States</h2>
          <div className="flex flex-wrap gap-4 p-6 border border-border rounded-lg">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium opacity-50 cursor-not-allowed" disabled>
              Disabled
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">
              <span className="inline-block animate-spin mr-2">⟳</span>
              Loading
            </button>
          </div>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> for testing purposes.
      </p>
    </div>
  )
}

