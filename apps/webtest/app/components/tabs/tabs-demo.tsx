'use client'

// Tabs Demo - Client Component for interactive HeroUI v3 Tabs
// Tabs require client-side JavaScript for interactivity

import { Tabs } from '@heroui/react'

/**
 * Basic Tabs Demo
 * Shows standard horizontal tabs with indicator
 */
export function BasicTabsDemo() {
  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Account options">
          <Tabs.Tab id="account">
            Account
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="password">
            Password
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="settings">
            Settings
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="account">
        <h3 className="font-medium mb-2">Account Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account information and preferences here.
        </p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="password">
        <h3 className="font-medium mb-2">Password Settings</h3>
        <p className="text-sm text-muted-foreground">
          Change your password and security preferences.
        </p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="settings">
        <h3 className="font-medium mb-2">Other Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure notifications, privacy, and other preferences.
        </p>
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Vertical Tabs Demo
 * Shows vertical orientation with sidebar-style tabs
 */
export function VerticalTabsDemo() {
  return (
    <Tabs className="w-full" orientation="vertical">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Vertical tabs">
          <Tabs.Tab id="profile">
            Profile
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="security">
            Security
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="notifications">
            Notifications
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="billing">
            Billing
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="px-4" id="profile">
        <h3 className="font-semibold mb-2">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your profile information and avatar.
        </p>
      </Tabs.Panel>
      <Tabs.Panel className="px-4" id="security">
        <h3 className="font-semibold mb-2">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure two-factor authentication and password settings.
        </p>
      </Tabs.Panel>
      <Tabs.Panel className="px-4" id="notifications">
        <h3 className="font-semibold mb-2">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Choose how and when you want to receive notifications.
        </p>
      </Tabs.Panel>
      <Tabs.Panel className="px-4" id="billing">
        <h3 className="font-semibold mb-2">Billing Information</h3>
        <p className="text-sm text-muted-foreground">
          View and manage your subscription and payment methods.
        </p>
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Disabled Tab Demo
 * Shows tabs with a disabled option
 */
export function DisabledTabDemo() {
  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Tabs with disabled">
          <Tabs.Tab id="active">
            Active
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab isDisabled id="disabled">
            Disabled
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="available">
            Available
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="active">
        <p className="text-sm text-muted-foreground">This tab is active and can be selected.</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="disabled">
        <p className="text-sm text-muted-foreground">This content cannot be accessed.</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="available">
        <p className="text-sm text-muted-foreground">This tab is also available for selection.</p>
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Custom Styled Tabs Demo
 * Shows tabs with custom styling via Tailwind classes
 */
export function CustomStyledTabsDemo() {
  return (
    <Tabs className="w-full text-center">
      <Tabs.ListContainer>
        <Tabs.List
          aria-label="Frequency options"
          className="*:data-[selected=true]:text-accent-foreground w-fit *:h-6 *:w-fit *:px-3 *:text-sm *:font-normal"
        >
          <Tabs.Tab id="daily">
            Daily
            <Tabs.Indicator className="bg-accent" />
          </Tabs.Tab>
          <Tabs.Tab id="weekly">
            Weekly
            <Tabs.Indicator className="bg-accent" />
          </Tabs.Tab>
          <Tabs.Tab id="monthly">
            Monthly
            <Tabs.Indicator className="bg-accent" />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  )
}

