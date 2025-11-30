// Installation Docs Page - Server Component using HeroUI v3

import { Card, CardContent, Separator } from "@neo/test-components"

export const metadata = {
  title: 'Installation | NEO Testground',
  description: 'Step-by-step guide to setting up HeroUI v3 with Next.js.',
}

export default function InstallationPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Installation</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Step-by-step guide to setting up HeroUI v3 with Next.js 16.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Prerequisites</h2>
          <Card>
            <CardContent className="p-6">
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Node.js 18.17 or later</li>
                <li>Next.js 16 with App Router</li>
                <li>Tailwind CSS v4</li>
                <li>A package manager (yarn recommended)</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Install HeroUI</h2>
          <Card>
            <CardContent className="p-6">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <code>yarn add @heroui/react</code>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Configure next.config.js</h2>
          <Card>
            <CardContent className="p-6">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`// next.config.js
module.exports = {
  transpilePackages: ['@heroui/react'],
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Add Component Styles</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                HeroUI v3 beta requires manual CSS for components. Add these styles to your globals.css:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`/* globals.css */
@import 'tailwindcss';

/* HeroUI Button styles */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: var(--radius);
  transition: all 150ms ease;
  cursor: pointer;
}

.button--primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}
/* ... more styles */`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Use Components</h2>
          <Card>
            <CardContent className="p-6">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`import { Button, Card, Chip } from "@neo/test-components"

export default function Page() {
  return (
    <Card>
      <Chip>New</Chip>
      <Button variant="primary">Click me</Button>
    </Card>
  )
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-semibold mb-4">Server Component Support</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                HeroUI v3 is built on React Aria Components and is designed to work with React Server Components.
                Most components can be rendered on the server without the "use client" directive.
              </p>
              <p className="text-muted-foreground">
                Interactive components (like dialogs, dropdowns, tooltips) require client components
                for event handling and state management.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This page is a <strong>Server Component</strong> — HeroUI is RSC-compatible.
      </p>
    </div>
  )
}
