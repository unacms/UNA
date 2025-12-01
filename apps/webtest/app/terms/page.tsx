// Terms of Service Page - React Server Component with UNA CMS Integration
// This is a SERVER COMPONENT - no "use client" directive
// Pre-rendered and cached with ISR (60s revalidation)

import { 
  Card, 
  CardContent,
  Separator
} from "@neo/test-components"
import { fetchUNAPage, extractTextFromHTML, extractPageContent } from "../lib/una-api"
import { PageFooter } from "../components/page-footer"

export const metadata = {
  title: 'Terms of Service | NEO Testground',
  description: 'Terms of Service for using the NEO platform.',
}

export default async function TermsPage() {
  // Fetch page data from UNA CMS with timing info
  const result = await fetchUNAPage('terms')
  const unaData = result.response
  
  // Extract content from UNA response
  const pageTitle = unaData?.data?.title || 'Terms of Service'
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
              Please read these terms carefully before using our services.
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
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:space-y-2
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
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground mb-8">
                  Last updated: December 1, 2025
                </p>

                <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-6">
                  By accessing and using NEO Testground, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by these terms, 
                  please do not use this service.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Use License</h2>
                <p className="text-muted-foreground mb-4">
                  Permission is granted to temporarily access the materials on NEO Testground for 
                  personal, non-commercial transitory viewing only. This is the grant of a license, 
                  not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                  <li>Transfer the materials to another person</li>
                </ul>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Disclaimer</h2>
                <p className="text-muted-foreground mb-6">
                  The materials on NEO Testground are provided on an &apos;as is&apos; basis. We make no 
                  warranties, expressed or implied, and hereby disclaim and negate all other 
                  warranties including, without limitation, implied warranties or conditions of 
                  merchantability, fitness for a particular purpose, or non-infringement of 
                  intellectual property or other violation of rights.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Limitations</h2>
                <p className="text-muted-foreground mb-6">
                  In no event shall NEO or its suppliers be liable for any damages (including, 
                  without limitation, damages for loss of data or profit, or due to business 
                  interruption) arising out of the use or inability to use the materials on 
                  NEO Testground.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Revisions</h2>
                <p className="text-muted-foreground mb-6">
                  We may revise these terms of service at any time without notice. By using this 
                  website you are agreeing to be bound by the then current version of these terms 
                  of service.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms, please contact us through the 
                  contact form on our website.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Report Footer - controlled by settings */}
      <PageFooter 
        pageName="Terms"
        data={{
          componentType: 'server',
          timing: { durationMs: result.timing.durationMs },
          cache: result.cache
        }}
      />
    </>
  )
}


