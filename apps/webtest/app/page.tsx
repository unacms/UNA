// UNA CMS Landing Page - Server Component
// Modern landing page showcasing UNA's capabilities

import { Button, Card, CardContent, Chip, Separator } from "@neo/test-components"
import Link from "next/link"
import { GlassyLink } from "./components/glassy-link"

// Icons as simple SVG components for performance
const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-accent/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Open Source Community Platform
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="block">Build Social Experiences</span>
          <span className="block mt-2 bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
            One Codebase, Every Platform
          </span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          UNA CMS powers the next generation of community platforms with an open-source backend, 
          universal React/React Native apps, standardized APIs, and enterprise-grade scalability.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <Button variant="primary" size="lg" className="text-base px-8" asChild>
                <Link href="/signup">
                  Start Building
                  <ArrowRightIcon />
                </Link>
              </Button>
          <Button variant="tertiary" size="lg" className="text-base px-8" asChild>
            <Link href="https://github.com/unacms">
              View on GitHub
            </Link>
          </Button>
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {['React 19', 'React Native', 'Next.js 16', 'Expo', 'TypeScript', 'REST API'].map((tech) => (
            <span key={tech} className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            Trusted by communities worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
            {['Enterprise', 'Startups', 'Nonprofits', 'Education', 'Healthcare', 'Government'].map((type) => (
              <span key={type} className="text-lg font-semibold text-foreground/70">{type}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <Chip className="bg-primary/10 text-primary mb-4">How it works</Chip>
          <h2 className="text-4xl font-bold mb-4">From Zero to Community in Minutes</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            UNA provides everything you need to build, deploy, and scale community platforms
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            step="01"
            title="Deploy Backend"
            description="Self-host or use UNA Cloud. Full PHP backend with MySQL, REST API, OAuth, and modular architecture ready to go."
            features={['One-click deployment', 'Docker support', 'Auto-scaling']}
          />
          <StepCard
            step="02"
            title="Configure & Customize"
            description="Use the Studio dashboard to customize your community: themes, modules, permissions, and integrations."
            features={['Visual customization', 'Module marketplace', 'White-label ready']}
          />
          <StepCard
            step="03"
            title="Launch Universal Apps"
            description="Deploy to web and mobile simultaneously with our React/React Native universal app framework."
            features={['iOS & Android', 'Progressive Web App', 'Real-time sync']}
          />
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Core Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <Chip className="bg-primary/10 text-primary mb-4">Core Features</Chip>
          <h2 className="text-4xl font-bold mb-4">Built for Modern Communities</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Enterprise-grade features with open-source flexibility
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<OpenSourceIcon />}
            title="100% Open Source"
            description="MIT-licensed core with full access to source code. No vendor lock-in, ever. Fork, modify, and contribute back to the community."
          />
          <FeatureCard
            icon={<UniversalIcon />}
            title="Universal App Framework"
            description="Single codebase powers web, iOS, and Android. Built on React Native with Expo for native performance everywhere."
          />
          <FeatureCard
            icon={<ApiIcon />}
            title="Standardized REST API"
            description="Clean, documented API endpoints for every feature. OAuth 2.0, webhooks, and third-party integrations out of the box."
          />
          <FeatureCard
            icon={<ScalableIcon />}
            title="Scalable Architecture"
            description="Handles millions of users with distributed caching, CDN integration, and horizontal scaling built into the core."
          />
          <FeatureCard
            icon={<ModularIcon />}
            title="Modular Design"
            description="Enable only what you need. 50+ official modules for profiles, groups, messaging, marketplace, events, and more."
          />
          <FeatureCard
            icon={<RealTimeIcon />}
            title="Real-Time Everything"
            description="WebSocket-powered notifications, live chat, activity feeds, and collaborative features with Pusher integration."
          />
        </div>
      </section>

      {/* Architecture Showcase */}
      <section className="bg-muted/30 border-y border-border py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Chip className="bg-primary/10 text-primary mb-4">Architecture</Chip>
              <h2 className="text-4xl font-bold mb-6">Designed for Scale</h2>
              <p className="text-muted-foreground text-lg mb-8">
                UNA's architecture separates concerns cleanly: a robust PHP backend handles business logic, 
                while universal React apps deliver beautiful user experiences across all platforms.
              </p>
              
              <div className="space-y-4">
                <ArchitectureItem
                  title="Backend: UNA Core"
                  description="PHP 8.2+, MySQL/MariaDB, Redis caching, queue workers"
                />
                <ArchitectureItem
                  title="Frontend: NEO Framework"
                  description="React 19, React Native, Expo Router, NativeWind"
                />
                <ArchitectureItem
                  title="API Layer"
                  description="REST endpoints, OAuth 2.0, rate limiting, versioning"
                />
                <ArchitectureItem
                  title="Real-Time"
                  description="Pusher channels, webhooks, event broadcasting"
                />
              </div>
            </div>

            <div className="relative">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
                <div className="space-y-4">
                  <CodeBlock
                    title="API Request"
                    code={`GET /api.php?r=system/get_data_api/
  TemplServiceProfiles&params[]={"id":123}

Response: {
  "profile": {
    "id": 123,
    "name": "John Doe",
    "avatar": "https://...",
    ...
  }
}`}
                  />
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl -z-10" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/30 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <Chip className="bg-primary/10 text-primary mb-4">Use Cases</Chip>
          <h2 className="text-4xl font-bold mb-4">Power Any Community Type</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From small hobby groups to enterprise intranets, UNA adapts to your needs
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <UseCaseCard
            title="Social Networks"
            description="Build the next Facebook alternative with profiles, posts, reactions, and friend connections."
            icon="🌐"
          />
          <UseCaseCard
            title="Professional Communities"
            description="LinkedIn-style networks for industries, alumni associations, and professional groups."
            icon="💼"
          />
          <UseCaseCard
            title="Learning Platforms"
            description="Online courses, cohort-based learning, and educational communities."
            icon="📚"
          />
          <UseCaseCard
            title="Marketplaces"
            description="Community marketplaces with listings, messaging, and transaction management."
            icon="🛒"
          />
          <UseCaseCard
            title="Fan Communities"
            description="Creator-focused platforms with subscriptions, exclusive content, and engagement tools."
            icon="⭐"
          />
          <UseCaseCard
            title="Enterprise Intranets"
            description="Private internal networks for companies with SSO, access control, and compliance."
            icon="🏢"
          />
          <UseCaseCard
            title="Nonprofit Networks"
            description="Member management, donations, volunteering, and cause-driven communities."
            icon="❤️"
          />
          <UseCaseCard
            title="Local Communities"
            description="Neighborhood networks, local businesses, and geographic communities."
            icon="📍"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-b from-background to-muted/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Chip className="bg-primary/10 text-primary mb-4">Why UNA</Chip>
            <h2 className="text-4xl font-bold mb-4">Own Your Platform, Not Just Use It</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stop renting. Start owning. UNA gives you complete control over your community's future.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              title="No Vendor Lock-in"
              description="Your data, your code, your servers. Export everything anytime. Switch providers or self-host with zero friction."
              stat="100%"
              statLabel="Data Ownership"
            />
            <BenefitCard
              title="Cost Effective"
              description="Open source core is free forever. Scale without per-user fees. Only pay for hosting and optional premium modules."
              stat="10x"
              statLabel="Lower TCO"
            />
            <BenefitCard
              title="Future Proof"
              description="Active development since 2007. Modern tech stack with React 19, TypeScript, and continuous innovation."
              stat="17+"
              statLabel="Years Active"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-3xl p-12 text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to Build Your Community?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Join thousands of community builders using UNA to create meaningful connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" className="text-base px-8" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button variant="tertiary" size="lg" className="text-base px-8" asChild>
                <Link href="/docs">
                  Read Documentation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-4">UNA CMS</h3>
              <p className="text-muted-foreground text-sm">
                Open-source community management system powering social experiences worldwide.
              </p>
            </div>
            <FooterLinks
              title="Product"
              links={[
                { label: 'Features', href: '/features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Modules', href: '/modules' },
                { label: 'Roadmap', href: '/roadmap' },
              ]}
            />
            <FooterLinks
              title="Developers"
              links={[
                { label: 'Documentation', href: '/docs' },
                { label: 'API Reference', href: '/api' },
                { label: 'GitHub', href: 'https://github.com/unacms' },
                { label: 'Discord', href: '/discord' },
              ]}
            />
            <FooterLinks
              title="Company"
              links={[
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'Terms', href: '/terms' },
                { label: 'Privacy', href: '/privacy' },
              ]}
            />
          </div>
          <Separator className="mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 UNA CMS. Open source under MIT License.
            </p>
            <div className="flex gap-6">
              <Link href="https://github.com/unacms" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
              <Link href="https://twitter.com/unacms" className="text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="/discord" className="text-muted-foreground hover:text-foreground transition-colors">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Component: Step Card
function StepCard({ step, title, description, features }: {
  step: string
  title: string
  description: string
  features: string[]
}) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-8">
        <span className="absolute top-4 right-4 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
          {step}
        </span>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// Component: Feature Card
function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

// Component: Use Case Card
function UseCaseCard({ icon, title, description }: {
  icon: string
  title: string
  description: string
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6 text-center">
        <span className="text-4xl mb-4 block">{icon}</span>
        <h3 className="font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}

// Component: Benefit Card
function BenefitCard({ title, description, stat, statLabel }: {
  title: string
  description: string
  stat: string
  statLabel: string
}) {
  return (
    <Card className="text-center p-8 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div className="text-5xl font-bold text-primary mb-2">{stat}</div>
        <div className="text-sm font-medium text-muted-foreground mb-4">{statLabel}</div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Component: Architecture Item
function ArchitectureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}

// Component: Code Block
function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-2">{title}</div>
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs font-mono text-foreground/90">
        {code}
      </pre>
    </div>
  )
}

// Component: Footer Links
function FooterLinks({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h4 className="font-semibold mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Icons as components
function OpenSourceIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}

function UniversalIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function ApiIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ScalableIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function ModularIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  )
}

function RealTimeIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
