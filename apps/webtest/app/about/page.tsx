// About Page - React Server Component with UNA CMS Integration
// This is a SERVER COMPONENT - no "use client" directive
// Pre-rendered and cached with ISR (60s revalidation)

import { 
  Button, 
  Card, 
  CardContent, 
  CardTitle, 
  CardDescription, 
  Separator
} from "@neo/test-components"
import Link from "next/link"
import { fetchUNAPage, extractTextFromHTML, extractPageContent } from "../lib/una-api"
import { PageFooter } from "../components/page-footer"

export const metadata = {
  title: 'About | NEO Testground',
  description: 'Learn about the NEO platform and our mission.',
}

export default async function AboutPage() {
  // Fetch page data from UNA CMS with timing info
  const result = await fetchUNAPage('about')
  const unaData = result.response
  
  // Extract content from UNA response
  const pageTitle = unaData?.data?.title || 'About NEO'
  const pageDescription = unaData?.data?.description || ''
  
  // Extract all content from UNA elements structure
  const mainContent = extractPageContent(unaData?.data)
  
  // Check connection status
  const isConnected = unaData !== null && unaData.status === 200
  const hasUNAContent = isConnected && !!mainContent

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {pageTitle}
          </h1>
          {pageDescription && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {extractTextFromHTML(pageDescription)}
            </p>
          )}
          {!pageDescription && !hasUNAContent && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Building the future of cross-platform applications with modern React patterns.
            </p>
          )}
        </section>

        {/* UNA CMS Content (if available) */}
        {hasUNAContent && mainContent && (
          <section className="mb-16">
            <Card>
              <CardContent className="p-8">
                <div 
                  dangerouslySetInnerHTML={{ __html: mainContent }}
                  className="una-content prose prose-neutral dark:prose-invert max-w-none
                    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:text-foreground
                    [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-foreground
                    [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-foreground
                    [&_p]:mb-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:space-y-2
                    [&_li]:text-muted-foreground
                    [&_strong]:text-foreground [&_strong]:font-semibold
                    [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                    [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-4"
                />
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Content loaded from UNA CMS
            </p>
          </section>
        )}

        {/* Static content fallback */}
        {!hasUNAContent && (
          <>
            <section className="mb-16">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Our Mission
              </h2>
              <p className="text-muted-foreground mb-4">
                NEO is an experimental platform exploring the boundaries of what is possible with 
                React Server Components, Next.js 16, and cross-platform development using React Native.
              </p>
              <p className="text-muted-foreground">
                We believe in building applications that are fast by default, accessible to everyone, 
                and delightful to use across all devices.
              </p>
            </section>

            <Separator className="my-12" />

            <section className="mb-16">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">
                Technology Stack
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <CardTitle>Next.js 16</CardTitle>
                    <CardDescription>App Router with Turbopack, Cache Components, and React Compiler</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <CardTitle>React 19</CardTitle>
                    <CardDescription>Server Components, Actions, and the latest React features</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <CardTitle>HeroUI v3</CardTitle>
                    <CardDescription>Beautiful, accessible components with React Aria and Tailwind CSS v4</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <CardTitle>React Native + Expo</CardTitle>
                    <CardDescription>Cross-platform mobile development with shared components</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}

        {/* Team section */}
        {!hasUNAContent && (
          <>
            <Separator className="my-12" />
            <section className="mb-16">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">
                The Team
              </h2>
              <div className="grid sm:grid-cols-3 gap-6">
                <TeamMember name="Alex Chen" role="Lead Developer" />
                <TeamMember name="Sarah Kim" role="Design Systems" />
                <TeamMember name="Mike Johnson" role="Platform Engineering" />
              </div>
            </section>
          </>
        )}

        <Separator className="my-12" />

        {/* CTA */}
        <section className="text-center py-12 px-8 bg-muted rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-6">
            Explore our documentation and start building today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" size="lg" asChild>
              <Link href="/docs">Read the Docs</Link>
            </Button>
            <Button variant="tertiary" size="lg" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Performance Report Footer - controlled by settings */}
      <PageFooter 
        pageName="About"
        data={{
          componentType: 'server',
          timing: { durationMs: result.timing.durationMs },
          cache: result.cache
        }}
      />
    </>
  )
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">👤</span>
        </div>
        <CardTitle className="text-base">{name}</CardTitle>
        <CardDescription>{role}</CardDescription>
      </CardContent>
    </Card>
  )
}
