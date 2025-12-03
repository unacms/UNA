'use client'

// Tabs Demo - Client Component for interactive HeroUI Tabs
// Demonstrates all variants, colors, sizes, and features

import { Tabs } from '@neo/test-components'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Settings, User, Bell, Camera, Music, Video, Image } from 'lucide-react'

/**
 * Basic Tabs Demo - Default solid variant
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
 * Dynamic Tabs Demo - Render tabs from array
 */
export function DynamicTabsDemo() {
  const tabs = [
    { id: 'photos', label: 'Photos', content: 'Your photo collection' },
    { id: 'music', label: 'Music', content: 'Your music library' },
    { id: 'videos', label: 'Videos', content: 'Your video collection' },
  ]

  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Media tabs">
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
      {tabs.map((tab) => (
        <Tabs.Panel key={tab.id} className="pt-4" id={tab.id}>
          <p className="text-muted-foreground">{tab.content}</p>
        </Tabs.Panel>
      ))}
    </Tabs>
  )
}

/**
 * Disabled Tabs Demo
 */
export function DisabledTabsDemo() {
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
 * All Disabled Tabs Demo
 */
export function AllDisabledTabsDemo() {
  return (
    <Tabs className="w-full" isDisabled>
      <Tabs.ListContainer>
        <Tabs.List aria-label="All disabled tabs">
          <Tabs.Tab id="tab1">
            Tab 1
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="tab2">
            Tab 2
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="tab3">
            Tab 3
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  )
}

/**
 * Size Variants Demo
 */
export function SizesDemo() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Size: sm</p>
        <Tabs size="sm">
          <Tabs.ListContainer>
            <Tabs.List aria-label="Small tabs">
              <Tabs.Tab id="sm-1">Small<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="sm-2">Tabs<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="sm-3">Here<Tabs.Indicator /></Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Size: md (default)</p>
        <Tabs size="md">
          <Tabs.ListContainer>
            <Tabs.List aria-label="Medium tabs">
              <Tabs.Tab id="md-1">Medium<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="md-2">Tabs<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="md-3">Here<Tabs.Indicator /></Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Size: lg</p>
        <Tabs size="lg">
          <Tabs.ListContainer>
            <Tabs.List aria-label="Large tabs">
              <Tabs.Tab id="lg-1">Large<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="lg-2">Tabs<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="lg-3">Here<Tabs.Indicator /></Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
    </div>
  )
}

/**
 * Radius Variants Demo
 */
export function RadiusDemo() {
  const radii = ['none', 'sm', 'md', 'lg', 'full'] as const
  return (
    <div className="space-y-4">
      {radii.map((r) => (
        <div key={r}>
          <p className="text-sm text-muted-foreground mb-2">Radius: {r}</p>
          <Tabs radius={r}>
            <Tabs.ListContainer>
              <Tabs.List aria-label={`${r} radius tabs`}>
                <Tabs.Tab id={`${r}-1`}>Tab 1<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`${r}-2`}>Tab 2<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`${r}-3`}>Tab 3<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      ))}
    </div>
  )
}

/**
 * Color Variants Demo
 */
export function ColorsDemo() {
  const colors = ['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const
  return (
    <div className="space-y-4">
      {colors.map((color) => (
        <div key={color}>
          <p className="text-sm text-muted-foreground mb-2 capitalize">{color}</p>
          <Tabs color={color}>
            <Tabs.ListContainer>
              <Tabs.List aria-label={`${color} color tabs`}>
                <Tabs.Tab id={`${color}-1`}>Photos<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`${color}-2`}>Music<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`${color}-3`}>Videos<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      ))}
    </div>
  )
}

/**
 * Variant Styles Demo - All 4 variants
 */
export function VariantsDemo() {
  const variants = ['solid', 'bordered', 'light', 'underlined'] as const
  return (
    <div className="space-y-6">
      {variants.map((variant) => (
        <div key={variant}>
          <p className="text-sm text-muted-foreground mb-2 capitalize">{variant}</p>
          <Tabs variant={variant}>
            <Tabs.ListContainer>
              <Tabs.List aria-label={`${variant} variant tabs`}>
                <Tabs.Tab id={`${variant}-1`}>Photos<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`${variant}-2`}>Music<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`${variant}-3`}>Videos<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      ))}
    </div>
  )
}

/**
 * Underlined with Colors Demo
 */
export function UnderlinedColorsDemo() {
  const colors = ['default', 'primary', 'success', 'warning', 'danger'] as const
  return (
    <div className="space-y-4">
      {colors.map((color) => (
        <div key={color}>
          <p className="text-sm text-muted-foreground mb-2 capitalize">{color}</p>
          <Tabs variant="underlined" color={color}>
            <Tabs.ListContainer>
              <Tabs.List aria-label={`underlined ${color} tabs`}>
                <Tabs.Tab id={`ul-${color}-1`}>Overview<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`ul-${color}-2`}>Analytics<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id={`ul-${color}-3`}>Reports<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      ))}
    </div>
  )
}

/**
 * With Icons Demo
 */
export function WithIconsDemo() {
  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Tabs with icons">
          <Tabs.Tab id="photos">
            <Image className="w-4 h-4" />
            Photos
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="music">
            <Music className="w-4 h-4" />
            Music
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="videos">
            <Video className="w-4 h-4" />
            Videos
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="photos">
        <p className="text-muted-foreground">Your photo gallery</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="music">
        <p className="text-muted-foreground">Your music library</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="videos">
        <p className="text-muted-foreground">Your video collection</p>
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Controlled Tabs Demo
 */
export function ControlledTabsDemo() {
  const [selected, setSelected] = useState<string>('photos')
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Selected:</span>
        <code className="px-2 py-1 bg-muted rounded text-sm">{selected}</code>
      </div>
      <Tabs 
        selectedKey={selected} 
        onSelectionChange={(key) => setSelected(key as string)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Controlled tabs">
            <Tabs.Tab id="photos">Photos<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="music">Music<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="videos">Videos<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="photos">
          <p className="text-muted-foreground">Photos panel content</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="music">
          <p className="text-muted-foreground">Music panel content</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="videos">
          <p className="text-muted-foreground">Videos panel content</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

/**
 * Vertical Tabs Demo
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
 * Vertical Underlined Demo
 */
export function VerticalUnderlinedDemo() {
  return (
    <Tabs className="w-full" orientation="vertical" variant="underlined" color="primary">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Vertical underlined tabs">
          <Tabs.Tab id="overview">Overview<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="analytics">Analytics<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="reports">Reports<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="settings">Settings<Tabs.Indicator /></Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="px-4" id="overview">
        <p className="text-muted-foreground">Overview content</p>
      </Tabs.Panel>
      <Tabs.Panel className="px-4" id="analytics">
        <p className="text-muted-foreground">Analytics content</p>
      </Tabs.Panel>
      <Tabs.Panel className="px-4" id="reports">
        <p className="text-muted-foreground">Reports content</p>
      </Tabs.Panel>
      <Tabs.Panel className="px-4" id="settings">
        <p className="text-muted-foreground">Settings content</p>
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Full Width Demo
 */
export function FullWidthDemo() {
  return (
    <Tabs fullWidth>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Full width tabs">
          <Tabs.Tab id="fw-1">First<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="fw-2">Second<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="fw-3">Third<Tabs.Indicator /></Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="fw-1">
        <p className="text-muted-foreground">First panel</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="fw-2">
        <p className="text-muted-foreground">Second panel</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="fw-3">
        <p className="text-muted-foreground">Third panel</p>
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Custom Styled Tabs Demo
 */
export function CustomStyledTabsDemo() {
  return (
    <Tabs 
      variant="underlined" 
      color="primary"
      className="w-full"
      classNames={{
        tabList: "gap-6",
        tab: "px-0",
      }}
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Custom styled tabs">
          <Tabs.Tab id="custom-1">
            <Camera className="w-4 h-4" />
            Photos
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="custom-2">
            <Music className="w-4 h-4" />
            Music
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="custom-3">
            <Video className="w-4 h-4" />
            Videos
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="custom-1">
        <p className="text-muted-foreground">Custom photos panel</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="custom-2">
        <p className="text-muted-foreground">Custom music panel</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="custom-3">
        <p className="text-muted-foreground">Custom videos panel</p>
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Router Integration Demo (Next.js)
 * Shows how to sync tabs with URL
 */
export function RouterIntegrationDemo() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Simulated routes
  const tabs = [
    { id: '/dashboard', label: 'Dashboard' },
    { id: '/settings', label: 'Settings' },
    { id: '/profile', label: 'Profile' },
  ]
  
  const handleSelectionChange = (key: React.Key) => {
    // In a real app, this would navigate: router.push(key as string)
    console.log('Navigate to:', key)
  }
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Current pathname: <code className="px-2 py-1 bg-muted rounded">{pathname}</code>
      </p>
      <Tabs 
        variant="underlined"
        selectedKey={tabs[0].id}  // In real app: pathname
        onSelectionChange={handleSelectionChange}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Navigation">
            {tabs.map((tab) => (
              <Tabs.Tab key={tab.id} id={tab.id} href={tab.id}>
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        Note: Navigation is simulated. In production, tabs would sync with URL via Next.js router.
      </p>
    </div>
  )
}

/**
 * No Animation Demo
 */
export function NoAnimationDemo() {
  return (
    <Tabs disableAnimation>
      <Tabs.ListContainer>
        <Tabs.List aria-label="No animation tabs">
          <Tabs.Tab id="na-1">Tab 1<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="na-2">Tab 2<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="na-3">Tab 3<Tabs.Indicator /></Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  )
}
