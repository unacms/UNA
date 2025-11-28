// Typography Docs Page - Pure Server Component

export const metadata = {
  title: 'Typography | NEO Testground',
  description: 'Styles for headings, paragraphs, lists and more.',
}

export default function TypographyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Typography</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Styles for headings, paragraphs, lists and more.
      </p>

      <div className="space-y-12">
        {/* Headings */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Headings</h2>
          <div className="space-y-4 border border-border rounded-lg p-6">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-bold">Heading 2</h2>
            <h3 className="text-2xl font-semibold">Heading 3</h3>
            <h4 className="text-xl font-semibold">Heading 4</h4>
            <h5 className="text-lg font-medium">Heading 5</h5>
            <h6 className="text-base font-medium">Heading 6</h6>
          </div>
        </section>

        {/* Paragraph */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Paragraph</h2>
          <div className="border border-border rounded-lg p-6">
            <p className="text-base leading-7">
              The quick brown fox jumps over the lazy dog. This sentence contains every letter
              of the alphabet and is commonly used for font previews and typography samples.
            </p>
            <p className="text-muted-foreground mt-4">
              This is muted text, used for secondary information and descriptions.
            </p>
          </div>
        </section>

        {/* Lists */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Lists</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-medium mb-3">Unordered List</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>First item</li>
                <li>Second item</li>
                <li>Third item</li>
              </ul>
            </div>
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-medium mb-3">Ordered List</h3>
              <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
                <li>First item</li>
                <li>Second item</li>
                <li>Third item</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Code */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Code</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <p>
              Inline code: <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">const x = 42</code>
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="font-mono text-sm overflow-x-auto">
{`function greet(name) {
  return \`Hello, \${name}!\`;
}`}
              </pre>
            </div>
          </div>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> for testing purposes.
      </p>
    </div>
  )
}

