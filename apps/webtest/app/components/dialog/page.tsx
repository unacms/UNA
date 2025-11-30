// Dialog Component Page - Server Component using HeroUI v3
// Note: Interactive dialog would require client component

import { Button, Card, CardContent, Separator } from "@neo/test-components"

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
          <Card>
            <CardContent className="p-6">
              {/* Static dialog preview */}
              <div className="relative w-full max-w-md mx-auto p-6 bg-background border border-border rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
                <p className="text-muted-foreground mb-6">
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="tertiary">Cancel</Button>
                  <Button variant="danger">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Usage */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Usage</h2>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="font-mono text-sm overflow-x-auto">
{`"use client"

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@neo/test-components"
import { useState } from "react"

export function DeleteDialog() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button variant="danger" onPress={() => setIsOpen(true)}>
        Delete Account
      </Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          <ModalHeader>Are you sure?</ModalHeader>
          <ModalBody>
            This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="tertiary" onPress={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger">Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}`}
            </pre>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: Dialog requires a client component for interactivity.
          </p>
        </section>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-16 pt-8 border-t border-border">
        This is a <strong>placeholder page</strong> showing a static preview.
      </p>
    </div>
  )
}
