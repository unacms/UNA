// Root Layout - Server Component
// Minimal shell for testing server-driven UI patterns

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NEO Testground',
  description: 'Experimental UI patterns and server component testing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}


