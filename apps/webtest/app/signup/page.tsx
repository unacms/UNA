// Signup Page - Server Component using HeroUI v3
// Note: Form inputs use native HTML as HeroUI Input requires client JS

import { Button, Card, CardContent, Separator } from "@neo/test-components"
import Link from "next/link"

export const metadata = {
  title: 'Sign Up | NEO Testground',
  description: 'Create your NEO account.',
}

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create an account</h1>
            <p className="text-muted-foreground">
              Get started with NEO today
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button variant="primary" className="w-full">
              Create Account
            </Button>
          </form>

          <Separator className="my-6" />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        This is a <strong>placeholder page</strong> for testing purposes.
      </p>
    </div>
  )
}
