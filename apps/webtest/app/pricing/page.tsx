// Pricing Page - Server Component using HeroUI v3

import { Button, Card, CardContent, Separator } from "@neo/test-components"
import Link from "next/link"

export const metadata = {
  title: 'Pricing | NEO Testground',
  description: 'Simple, transparent pricing for teams of all sizes.',
}

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for trying out NEO',
    features: [
      'Up to 3 projects',
      'Basic components',
      'Community support',
      'Public repositories',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing teams and projects',
    features: [
      'Unlimited projects',
      'All components',
      'Priority support',
      'Private repositories',
      'Advanced analytics',
      'Custom themes',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
      'Security audit',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that's right for your team. All plans include a 14-day free trial.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="grid md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <PricingCard key={plan.name} {...plan} />
        ))}
      </section>

      <Separator className="my-12" />

      {/* FAQ */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <FAQ
            question="Can I change plans later?"
            answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any differences."
          />
          <FAQ
            question="What payment methods do you accept?"
            answer="We accept all major credit cards, PayPal, and bank transfers for annual plans. Enterprise customers can also pay via invoice."
          />
          <FAQ
            question="Is there a free trial?"
            answer="Yes! All paid plans include a 14-day free trial. No credit card required to start."
          />
          <FAQ
            question="What happens when my trial ends?"
            answer="You'll be prompted to choose a plan. If you don't upgrade, your account will be downgraded to the Starter plan automatically."
          />
        </div>
      </section>

      <Separator className="my-12" />

      {/* CTA */}
      <section className="text-center py-12 px-8 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
        <p className="text-muted-foreground mb-6">
          Our team is here to help you find the right plan.
        </p>
        <Button variant="tertiary" size="lg" asChild>
          <Link href="/about">Contact Us</Link>
        </Button>
      </section>

      {/* Footer note */}
      <p className="text-center text-sm text-muted-foreground mt-12">
        This page is a <strong>Server Component</strong> — HeroUI is RSC-compatible.
      </p>
    </div>
  )
}

// Pure function components
function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted,
}: {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}) {
  return (
    <Card className={highlighted ? 'border-primary ring-2 ring-primary' : ''}>
      <CardContent className="p-8">
        {highlighted && (
          <span className="inline-block px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-4">
            Most Popular
          </span>
        )}
        <h3 className="text-xl font-semibold">{name}</h3>
        <div className="mt-4 mb-2">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </div>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>

        <Button 
          variant={highlighted ? 'primary' : 'tertiary'}
          className="w-full"
          asChild
        >
          <Link href="/signup">{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-primary shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-border pb-6">
      <h3 className="font-medium mb-2">{question}</h3>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  )
}
