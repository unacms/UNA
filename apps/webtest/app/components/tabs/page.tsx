// Tabs Component Page - Comprehensive Documentation
// HeroUI Tabs with full v2.8.5 variant support

import { Card, CardContent, Separator } from "@neo/test-components"
import { 
  BasicTabsDemo,
  DynamicTabsDemo,
  DisabledTabsDemo,
  AllDisabledTabsDemo,
  SizesDemo,
  RadiusDemo,
  ColorsDemo,
  VariantsDemo,
  UnderlinedColorsDemo,
  WithIconsDemo,
  ControlledTabsDemo,
  VerticalTabsDemo,
  VerticalUnderlinedDemo,
  FullWidthDemo,
  CustomStyledTabsDemo,
  RouterIntegrationDemo,
  NoAnimationDemo,
} from "./tabs-demo"
import { PageFooter } from "../page-footer"

export const metadata = {
  title: 'Tabs | NEO Testground',
  description: 'HeroUI Tabs - organize content into multiple sections with full variant support.',
}

export default function TabsComponentPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Tabs</h1>
        <p className="text-xl text-muted-foreground mb-4">
          Tabs organize content into multiple sections and allow users to navigate between them.
        </p>
        <p className="text-muted-foreground mb-12">
          Built on React Aria Components for full accessibility. Supports multiple variants, 
          colors, sizes, and seamless Next.js router integration.
        </p>

        <div className="space-y-16">
          {/* Installation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Installation</h2>
            <Card>
              <CardContent className="p-0">
                <pre className="font-mono text-sm overflow-x-auto p-6 bg-muted/50 rounded-lg">
{`import { Tabs } from '@neo/test-components'`}
                </pre>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Basic Usage */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Usage</h2>
            <p className="text-muted-foreground mb-6">
              HeroUI Tabs use a compound component pattern. Each Tab contains its own Indicator 
              for the sliding animation effect.
            </p>
            <Card>
              <CardContent className="p-6">
                <BasicTabsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Dynamic Tabs */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Dynamic</h2>
            <p className="text-muted-foreground mb-6">
              You can render tabs dynamically from an array of items.
            </p>
            <Card>
              <CardContent className="p-6">
                <DynamicTabsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Disabled */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Disabled</h2>
            <p className="text-muted-foreground mb-6">
              Use <code className="px-1.5 py-0.5 bg-muted rounded text-sm">isDisabled</code> on 
              the Tabs component to disable all tabs, or on individual Tab items.
            </p>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium mb-4">Individual tab disabled:</p>
                  <DisabledTabsDemo />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium mb-4">All tabs disabled:</p>
                  <AllDisabledTabsDemo />
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Sizes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Sizes</h2>
            <p className="text-muted-foreground mb-6">
              Three size options: <code className="px-1.5 py-0.5 bg-muted rounded text-sm">sm</code>, 
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm mx-1">md</code> (default), 
              and <code className="px-1.5 py-0.5 bg-muted rounded text-sm">lg</code>.
            </p>
            <Card>
              <CardContent className="p-6">
                <SizesDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Radius */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Radius</h2>
            <p className="text-muted-foreground mb-6">
              Customize the border radius: <code className="px-1.5 py-0.5 bg-muted rounded text-sm">none</code>, 
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm mx-1">sm</code>,
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm mx-1">md</code>,
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm mx-1">lg</code>,
              or <code className="px-1.5 py-0.5 bg-muted rounded text-sm">full</code>.
            </p>
            <Card>
              <CardContent className="p-6">
                <RadiusDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Colors */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Colors</h2>
            <p className="text-muted-foreground mb-6">
              Six color options that style the indicator and selected tab text.
            </p>
            <Card>
              <CardContent className="p-6">
                <ColorsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Variants */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Variants</h2>
            <p className="text-muted-foreground mb-6">
              Four visual variants: <code className="px-1.5 py-0.5 bg-muted rounded text-sm">solid</code> (default), 
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm mx-1">bordered</code>,
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm mx-1">light</code>, and 
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm ml-1">underlined</code>.
            </p>
            <Card>
              <CardContent className="p-6">
                <VariantsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Underlined with Colors */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Underlined with Colors</h2>
            <p className="text-muted-foreground mb-6">
              The underlined variant works great with color options for navigation-style tabs.
            </p>
            <Card>
              <CardContent className="p-6">
                <UnderlinedColorsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* With Icons */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">With Icons</h2>
            <p className="text-muted-foreground mb-6">
              Add icons alongside tab labels for better visual context.
            </p>
            <Card>
              <CardContent className="p-6">
                <WithIconsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Controlled */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Controlled</h2>
            <p className="text-muted-foreground mb-6">
              Use <code className="px-1.5 py-0.5 bg-muted rounded text-sm">selectedKey</code> and 
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm ml-1">onSelectionChange</code> for 
              controlled tab selection.
            </p>
            <Card>
              <CardContent className="p-6">
                <ControlledTabsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Vertical */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Vertical</h2>
            <p className="text-muted-foreground mb-6">
              Set <code className="px-1.5 py-0.5 bg-muted rounded text-sm">orientation="vertical"</code> for 
              sidebar-style navigation.
            </p>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium mb-4">Vertical Solid:</p>
                  <VerticalTabsDemo />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium mb-4">Vertical Underlined:</p>
                  <VerticalUnderlinedDemo />
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Full Width */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Full Width</h2>
            <p className="text-muted-foreground mb-6">
              Use <code className="px-1.5 py-0.5 bg-muted rounded text-sm">fullWidth</code> to make 
              tabs expand to fill the container.
            </p>
            <Card>
              <CardContent className="p-6">
                <FullWidthDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Links / Router Integration */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Links (Next.js Router)</h2>
            <p className="text-muted-foreground mb-6">
              Tabs can be rendered as links with the <code className="px-1.5 py-0.5 bg-muted rounded text-sm">href</code> prop. 
              Sync with Next.js router using <code className="px-1.5 py-0.5 bg-muted rounded text-sm">selectedKey</code>.
            </p>
            <Card>
              <CardContent className="p-6">
                <RouterIntegrationDemo />
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardContent className="p-0">
                <pre className="font-mono text-sm overflow-x-auto p-6 bg-muted/50 rounded-lg">
{`'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Tabs } from '@neo/test-components'

export function NavigationTabs() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Tabs 
      variant="underlined"
      selectedKey={pathname}
      onSelectionChange={(key) => router.push(key as string)}
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Navigation">
          <Tabs.Tab id="/dashboard" href="/dashboard">
            Dashboard
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="/settings" href="/settings">
            Settings
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  )
}`}
                </pre>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Custom Styles */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Custom Styles</h2>
            <p className="text-muted-foreground mb-6">
              Customize tabs with Tailwind CSS classes via the <code className="px-1.5 py-0.5 bg-muted rounded text-sm">className</code> and 
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm ml-1">classNames</code> props.
            </p>
            <Card>
              <CardContent className="p-6">
                <CustomStyledTabsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* No Animation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Disable Animation</h2>
            <p className="text-muted-foreground mb-6">
              Use <code className="px-1.5 py-0.5 bg-muted rounded text-sm">disableAnimation</code> or 
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm ml-1">disableCursorAnimation</code> to 
              turn off the indicator animation.
            </p>
            <Card>
              <CardContent className="p-6">
                <NoAnimationDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Slots */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Slots</h2>
            <p className="text-muted-foreground mb-6">
              Customize specific parts of the Tabs component using CSS classes targeting these slots:
            </p>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm">
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">.tabs</code> - Root container</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">.tabs__list-container</code> - Tab list wrapper</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">.tabs__list</code> - Tab list (contains tabs)</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">.tabs__tab</code> - Individual tab button</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">.tabs__indicator</code> - Animated selection indicator</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">.tabs__panel</code> - Tab panel content</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Data Attributes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Attributes</h2>
            <p className="text-muted-foreground mb-6">
              Tab elements expose these data attributes for styling:
            </p>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm">
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">[data-selected]</code> - When tab is selected</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">[data-disabled]</code> - When tab is disabled</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">[data-hovered]</code> - When tab is hovered</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">[data-focus-visible]</code> - When tab has keyboard focus</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">[data-pressed]</code> - When tab is being pressed</li>
                  <li><code className="px-1.5 py-0.5 bg-muted rounded">[data-orientation]</code> - "horizontal" or "vertical"</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Accessibility */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Accessibility</h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>✓ Mouse, touch, and keyboard interactions supported</li>
                  <li>✓ Arrow key navigation between tabs</li>
                  <li>✓ Disabled tabs properly announced</li>
                  <li>✓ Follows ARIA tabs pattern with proper roles</li>
                  <li>✓ Tab panels associated with their triggers</li>
                  <li>✓ Focus management for panels without focusable children</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* API Reference */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
            
            <div className="space-y-6">
              {/* Tabs Props */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Tabs Props</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium">Prop</th>
                          <th className="text-left py-2 pr-4 font-medium">Type</th>
                          <th className="text-left py-2 pr-4 font-medium">Default</th>
                          <th className="text-left py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">children*</td>
                          <td className="py-2 pr-4 font-mono">ReactNode</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Tab content</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">variant</td>
                          <td className="py-2 pr-4 font-mono">"solid" | "bordered" | "light" | "underlined"</td>
                          <td className="py-2 pr-4">"solid"</td>
                          <td className="py-2">Visual style variant</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">color</td>
                          <td className="py-2 pr-4 font-mono">"default" | "primary" | "secondary" | "success" | "warning" | "danger"</td>
                          <td className="py-2 pr-4">"default"</td>
                          <td className="py-2">Color theme</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">size</td>
                          <td className="py-2 pr-4 font-mono">"sm" | "md" | "lg"</td>
                          <td className="py-2 pr-4">"md"</td>
                          <td className="py-2">Tab size</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">radius</td>
                          <td className="py-2 pr-4 font-mono">"none" | "sm" | "md" | "lg" | "full"</td>
                          <td className="py-2 pr-4">varies</td>
                          <td className="py-2">Border radius style</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">orientation</td>
                          <td className="py-2 pr-4 font-mono">"horizontal" | "vertical"</td>
                          <td className="py-2 pr-4">"horizontal"</td>
                          <td className="py-2">Tab layout direction</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">fullWidth</td>
                          <td className="py-2 pr-4 font-mono">boolean</td>
                          <td className="py-2 pr-4">false</td>
                          <td className="py-2">Tabs expand to fill container</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">selectedKey</td>
                          <td className="py-2 pr-4 font-mono">Key</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Controlled selected tab</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">defaultSelectedKey</td>
                          <td className="py-2 pr-4 font-mono">Key</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Default selected tab</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">isDisabled</td>
                          <td className="py-2 pr-4 font-mono">boolean</td>
                          <td className="py-2 pr-4">false</td>
                          <td className="py-2">Disable all tabs</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">disableAnimation</td>
                          <td className="py-2 pr-4 font-mono">boolean</td>
                          <td className="py-2 pr-4">false</td>
                          <td className="py-2">Disable indicator animation</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-foreground">showSeparators</td>
                          <td className="py-2 pr-4 font-mono">boolean</td>
                          <td className="py-2 pr-4">true</td>
                          <td className="py-2">Show dividers (solid variant)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs Events */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Tabs Events</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium">Event</th>
                          <th className="text-left py-2 pr-4 font-medium">Type</th>
                          <th className="text-left py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr>
                          <td className="py-2 pr-4 font-mono text-foreground">onSelectionChange</td>
                          <td className="py-2 pr-4 font-mono">(key: Key) =&gt; void</td>
                          <td className="py-2">Called when selected tab changes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tab Props */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Tabs.Tab Props</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium">Prop</th>
                          <th className="text-left py-2 pr-4 font-medium">Type</th>
                          <th className="text-left py-2 pr-4 font-medium">Default</th>
                          <th className="text-left py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">id*</td>
                          <td className="py-2 pr-4 font-mono">string</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Unique tab identifier</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">children</td>
                          <td className="py-2 pr-4 font-mono">ReactNode</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Tab content (label + indicator)</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">isDisabled</td>
                          <td className="py-2 pr-4 font-mono">boolean</td>
                          <td className="py-2 pr-4">false</td>
                          <td className="py-2">Disable this tab</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-foreground">href</td>
                          <td className="py-2 pr-4 font-mono">string</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">URL for tab as link</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Panel Props */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Tabs.Panel Props</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium">Prop</th>
                          <th className="text-left py-2 pr-4 font-medium">Type</th>
                          <th className="text-left py-2 pr-4 font-medium">Default</th>
                          <th className="text-left py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">id*</td>
                          <td className="py-2 pr-4 font-mono">string</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Matching tab id</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-foreground">children</td>
                          <td className="py-2 pr-4 font-mono">ReactNode</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Panel content</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>

      <PageFooter 
        pageName="Tabs"
        data={{ componentType: 'hybrid' }}
      />
    </>
  )
}
