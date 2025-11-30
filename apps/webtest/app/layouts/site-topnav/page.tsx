// Site Top Nav Demo Page - Server Component using HeroUI v3
import { Button, Card, CardContent, CardTitle, CardDescription, Chip } from "@heroui/react"
import { cacheLife } from 'next/cache'
import Link from "next/link"

export const metadata = {
  title: 'Site Top Nav | NEO Testground',
  description: 'Public pages with horizontal navigation demo.',
}

export default async function SiteTopNavPage() {
  'use cache'
  cacheLife('max')

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 px-6 bg-linear-to-b from-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <Chip className="bg-primary/10 text-primary mb-4">
            Welcome to NEO
          </Chip>
          <h1 className="text-5xl font-bold mb-6">
            Connect, Share, and Grow Together
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Join a community of creators, thinkers, and innovators. Share your ideas and discover what matters to you.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" size="lg" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button variant="tertiary" size="lg" asChild>
              <Link href="/docs">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose NEO</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="👥"
              title="Communities"
              description="Join groups that match your interests"
            />
            <FeatureCard
              icon="💬"
              title="Conversations"
              description="Engage in meaningful discussions"
            />
            <FeatureCard
              icon="📅"
              title="Events"
              description="Discover and create local events"
            />
            <FeatureCard
              icon="🛡️"
              title="Privacy First"
              description="Your data stays yours"
            />
          </div>
        </div>
      </section>

      {/* Info banner */}
      <section className="py-8 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Server Component Demo:</strong> This entire page is rendered on the server.
            Zero client JavaScript for the static content. Check the Network tab - no hydration bundle!
          </p>
        </div>
      </section>
    </>
  )
}

// Pure function component - renders as Server Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-4xl mb-4">{icon}</div>
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
