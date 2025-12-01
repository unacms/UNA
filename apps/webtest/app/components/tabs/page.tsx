// Tabs Component Page - Server Component with Client Tab Demos
// HeroUI v3 Tabs use compound pattern: Tabs.List, Tabs.Tab, Tabs.Panel, Tabs.Indicator

import { Card, CardContent, Separator } from "@neo/test-components"
import { 
  BasicTabsDemo, 
  VerticalTabsDemo, 
  DisabledTabDemo,
  CustomStyledTabsDemo 
} from "./tabs-demo"
import { PageFooter } from "../page-footer"

export const metadata = {
  title: 'Tabs | NEO Testground',
  description: 'HeroUI v3 Tabs - organize content into multiple sections.',
}

export default function TabsComponentPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Tabs</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Tabs organize content into multiple sections and allow users to navigate between them.
          Built on React Aria Components for full accessibility.
        </p>

        <div className="space-y-12">
          {/* Basic Tabs */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Basic Tabs</h2>
            <p className="text-muted-foreground mb-6">
              Standard horizontal tabs with an animated indicator.
            </p>
            <Card>
              <CardContent className="p-6">
                <BasicTabsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Vertical Tabs */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Vertical Tabs</h2>
            <p className="text-muted-foreground mb-6">
              Tabs can be oriented vertically for sidebar-style navigation.
            </p>
            <Card>
              <CardContent className="p-6">
                <VerticalTabsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Disabled Tab */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Disabled Tab</h2>
            <p className="text-muted-foreground mb-6">
              Individual tabs can be disabled to prevent selection.
            </p>
            <Card>
              <CardContent className="p-6">
                <DisabledTabDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Custom Styles */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Custom Styles</h2>
            <p className="text-muted-foreground mb-6">
              Tabs can be customized with Tailwind CSS classes.
            </p>
            <Card>
              <CardContent className="p-6 flex justify-center">
                <CustomStyledTabsDemo />
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Usage Code */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Usage</h2>
            <p className="text-muted-foreground mb-6">
              HeroUI v3 Tabs use a compound component pattern with dot notation.
              Tabs require client-side JavaScript for interactivity.
            </p>
            <Card>
              <CardContent className="p-0">
                <pre className="font-mono text-sm overflow-x-auto p-6 bg-muted/50 rounded-lg">
{`'use client'

import { Tabs } from '@heroui/react'

export function MyTabs() {
  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Options">
          <Tabs.Tab id="overview">
            Overview
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="analytics">
            Analytics
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="overview">
        <p>View your project overview.</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="analytics">
        <p>Track your metrics.</p>
      </Tabs.Panel>
    </Tabs>
  )
}`}
                </pre>
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
                          <td className="py-2 pr-4 font-mono text-foreground">orientation</td>
                          <td className="py-2 pr-4 font-mono">"horizontal" | "vertical"</td>
                          <td className="py-2 pr-4">"horizontal"</td>
                          <td className="py-2">Tab layout orientation</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">selectedKey</td>
                          <td className="py-2 pr-4 font-mono">string</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Controlled selected tab key</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-foreground">defaultSelectedKey</td>
                          <td className="py-2 pr-4 font-mono">string</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Default selected tab key</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-foreground">onSelectionChange</td>
                          <td className="py-2 pr-4 font-mono">(key: Key) =&gt; void</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Selection change handler</td>
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
                          <td className="py-2 pr-4 font-mono text-foreground">id</td>
                          <td className="py-2 pr-4 font-mono">string</td>
                          <td className="py-2 pr-4">-</td>
                          <td className="py-2">Unique tab identifier</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-foreground">isDisabled</td>
                          <td className="py-2 pr-4 font-mono">boolean</td>
                          <td className="py-2 pr-4">false</td>
                          <td className="py-2">Whether tab is disabled</td>
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
