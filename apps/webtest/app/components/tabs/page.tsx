// Tabs Component Page - Pure Server Component

export const metadata = {
  title: 'Tabs | NEO Testground',
  description: 'A set of layered sections of content.',
}

export default function TabsComponentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Tabs</h1>
      <p className="text-xl text-muted-foreground mb-12">
        A set of layered sections of content—known as tab panels—that display one panel at a time.
      </p>

      <div className="space-y-12">
        {/* Preview */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Preview</h2>
          <div className="p-6 border border-border rounded-lg">
            {/* Static tabs preview */}
            <div className="w-full">
              <div className="flex border-b border-border">
                <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-foreground">
                  Account
                </button>
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Password
                </button>
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Settings
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-2">Account Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your account settings and preferences here.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Usage</h2>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="font-mono text-sm overflow-x-auto">
{`import { Tabs } from '@base-ui/tabs'

<Tabs.Root defaultValue="account">
  <Tabs.List>
    <Tabs.Tab value="account">Account</Tabs.Tab>
    <Tabs.Tab value="password">Password</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="account">
    Account content here.
  </Tabs.Panel>
  <Tabs.Panel value="password">
    Password content here.
  </Tabs.Panel>
</Tabs.Root>`}
            </pre>
          </div>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> for testing purposes.
      </p>
    </div>
  )
}

