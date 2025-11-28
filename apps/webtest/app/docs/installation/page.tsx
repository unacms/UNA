// Installation Docs Page - Pure Server Component

export const metadata = {
  title: 'Installation | NEO Testground',
  description: 'Step-by-step guide to setting up your development environment.',
}

export default function InstallationPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Installation</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Step-by-step guide to setting up your development environment.
      </p>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4">Prerequisites</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Node.js 18.17 or later</li>
          <li>macOS, Windows, or Linux</li>
          <li>A package manager (npm, yarn, or pnpm)</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Quick Start</h2>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-4">
          <code>npx create-neo-app@latest my-app</code>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Manual Installation</h2>
        <ol className="list-decimal pl-6 space-y-4 text-muted-foreground">
          <li>
            <strong className="text-foreground">Install dependencies</strong>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm mt-2">
              <code>yarn add next react react-dom</code>
            </div>
          </li>
          <li>
            <strong className="text-foreground">Create your first page</strong>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm mt-2">
              <code>mkdir -p app && touch app/page.tsx</code>
            </div>
          </li>
          <li>
            <strong className="text-foreground">Start the development server</strong>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm mt-2">
              <code>yarn dev</code>
            </div>
          </li>
        </ol>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> for testing purposes.
      </p>
    </div>
  )
}

