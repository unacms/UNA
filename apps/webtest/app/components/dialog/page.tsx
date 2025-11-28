// Dialog Component Page - Pure Server Component

export const metadata = {
  title: 'Dialog | NEO Testground',
  description: 'A modal dialog that interrupts the user.',
}

export default function DialogComponentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Dialog</h1>
      <p className="text-xl text-muted-foreground mb-12">
        A modal dialog that interrupts the user with important content.
      </p>

      <div className="space-y-12">
        {/* Preview */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Preview</h2>
          <div className="p-6 border border-border rounded-lg">
            {/* Static dialog preview */}
            <div className="relative w-full max-w-md mx-auto p-6 bg-background border border-border rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
              <p className="text-muted-foreground mb-6">
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers.
              </p>
              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 border border-input rounded-md font-medium hover:bg-accent">
                  Cancel
                </button>
                <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Usage */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Usage</h2>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="font-mono text-sm overflow-x-auto">
{`import { Dialog } from '@base-ui/dialog'

<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Popup>
      <Dialog.Title>Dialog Title</Dialog.Title>
      <Dialog.Description>
        Dialog content goes here.
      </Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>`}
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

