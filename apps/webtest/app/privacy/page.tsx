// Privacy Policy Page - React Server Component with UNA CMS Integration
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
  title: 'Privacy Policy | NEO Testground',
  description: 'Privacy Policy for the NEO platform - how we handle your data.',
}

export default async function PrivacyPage() {
  // Fetch page data from UNA CMS with timing info
  const result = await fetchUNAPage('privacy')
  const unaData = result.response
  
  // Extract content from UNA response
  const pageTitle = unaData?.data?.title || 'Privacy Policy'
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
              Your privacy is important to us. Learn how we collect, use, and protect your information.
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

                <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us, such as when you create an 
                  account, use our services, or contact us for support. This may include:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                  <li>Name and email address</li>
                  <li>Account credentials</li>
                  <li>Profile information</li>
                  <li>Communications you send to us</li>
                  <li>Usage data and preferences</li>
                </ul>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent security incidents</li>
                </ul>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Information Sharing</h2>
                <p className="text-muted-foreground mb-6">
                  We do not share, sell, or otherwise disclose your personal information for 
                  purposes other than those outlined in this Privacy Policy. We may share 
                  information with third-party service providers who perform services on our 
                  behalf, such as hosting, analytics, and customer service.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Security</h2>
                <p className="text-muted-foreground mb-6">
                  We take reasonable measures to help protect information about you from loss, 
                  theft, misuse, unauthorized access, disclosure, alteration, and destruction. 
                  However, no internet or electronic storage system is completely secure.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Cookies and Tracking</h2>
                <p className="text-muted-foreground mb-6">
                  We use cookies and similar tracking technologies to collect and use personal 
                  information about you. Cookies help us remember your preferences and improve 
                  your experience. You can control cookies through your browser settings.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location, you may have certain rights regarding your personal 
                  information, including:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                  <li>Access to your personal data</li>
                  <li>Correction of inaccurate data</li>
                  <li>Deletion of your data</li>
                  <li>Data portability</li>
                  <li>Opt-out of marketing communications</li>
                </ul>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Changes to This Policy</h2>
                <p className="text-muted-foreground mb-6">
                  We may change this Privacy Policy from time to time. If we make changes, we 
                  will notify you by revising the date at the top of the policy and, in some 
                  cases, we may provide you with additional notice.
                </p>

                <Separator className="my-8" />

                <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us through 
                  the contact form on our website or email us at privacy@neo.so.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Report Footer - controlled by settings */}
      <PageFooter 
        pageName="Privacy"
        data={{
          componentType: 'server',
          timing: { durationMs: result.timing.durationMs },
          cache: result.cache
        }}
      />
    </>
  )
}


