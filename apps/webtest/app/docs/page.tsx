// Docs Page - Pure Server Component
import Link from 'next/link'

export const metadata = {
  title: 'Documentation | NEO Testground',
  description: 'Learn the fundamentals of the NEO platform.',
}

const sections = [
  {
    title: 'Getting Started',
    links: [
      { href: '/docs/installation', title: 'Installation', description: 'Set up your development environment' },
      { href: '/docs/typography', title: 'Typography', description: 'Text styles and formatting' },
    ],
  },
  {
    title: 'Components',
    links: [
      { href: '/components/button', title: 'Button', description: 'Interactive button component' },
      { href: '/components/dialog', title: 'Dialog', description: 'Modal dialog component' },
      { href: '/components/tabs', title: 'Tabs', description: 'Tabbed content component' },
      { href: '/components/tooltip', title: 'Tooltip', description: 'Hover tooltip component' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Learn the fundamentals of the NEO platform and get started quickly.
      </p>

      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-2xl font-semibold mb-6">{section.title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block p-6 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium mb-1">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> for testing purposes.
      </p>
    </div>
  )
}

