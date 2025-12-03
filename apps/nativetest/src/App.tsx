/**
 * NEO Native Test App
 * 
 * Demonstrates:
 * - Icon usage with Lucide React Native
 * - Tabs component with HeroUI Native API
 */

import { StatusBar } from 'expo-status-bar'
import { View, Text, ScrollView } from 'react-native'
import { useState } from 'react'
import { Sun, Moon, Home, Settings, User, Bell, Heart, Star, Image, Music, Video } from 'lucide-react-native'
import { DynamicIcon } from './components/Icon'
import { Tabs } from '@neo/test-components'
import './global.css'

/**
 * Tabs Demo - Pill Variant (default)
 */
function TabsPillDemo() {
  return (
    <Tabs defaultValue="photos" variant="solid">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Media tabs">
          <Tabs.Indicator />
          <Tabs.Trigger value="photos">
            <Image size={16} color="#71717a" />
            <Tabs.Label>Photos</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="music">
            <Music size={16} color="#71717a" />
            <Tabs.Label>Music</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="videos">
            <Video size={16} color="#71717a" />
            <Tabs.Label>Videos</Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Content value="photos">
        <Text className="text-muted-foreground">Your photo gallery</Text>
      </Tabs.Content>
      <Tabs.Content value="music">
        <Text className="text-muted-foreground">Your music library</Text>
      </Tabs.Content>
      <Tabs.Content value="videos">
        <Text className="text-muted-foreground">Your video collection</Text>
      </Tabs.Content>
    </Tabs>
  )
}

/**
 * Tabs Demo - Underlined Variant
 */
function TabsUnderlinedDemo() {
  return (
    <Tabs defaultValue="overview" variant="underlined" color="primary">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Navigation tabs">
          <Tabs.Indicator />
          <Tabs.Trigger value="overview">
            <Tabs.Label>Overview</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="analytics">
            <Tabs.Label>Analytics</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="reports">
            <Tabs.Label>Reports</Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Content value="overview">
        <Text className="text-muted-foreground">Project overview</Text>
      </Tabs.Content>
      <Tabs.Content value="analytics">
        <Text className="text-muted-foreground">Analytics data</Text>
      </Tabs.Content>
      <Tabs.Content value="reports">
        <Text className="text-muted-foreground">Generated reports</Text>
      </Tabs.Content>
    </Tabs>
  )
}

/**
 * Tabs Demo - With Colors
 */
function TabsColorsDemo() {
  const [selected, setSelected] = useState('primary')
  
  return (
    <View className="gap-4">
      <Tabs value={selected} onValueChange={setSelected} color="success">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Color tabs">
            <Tabs.Indicator />
            <Tabs.Trigger value="primary">
              <Tabs.Label>Primary</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="success">
              <Tabs.Label>Success</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="warning">
              <Tabs.Label>Warning</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Content value="primary">
          <Text className="text-muted-foreground">Primary tab content</Text>
        </Tabs.Content>
        <Tabs.Content value="success">
          <Text className="text-muted-foreground">Success tab content</Text>
        </Tabs.Content>
        <Tabs.Content value="warning">
          <Text className="text-muted-foreground">Warning tab content</Text>
        </Tabs.Content>
      </Tabs>
      <Text className="text-xs text-muted-foreground">Selected: {selected}</Text>
    </View>
  )
}

export default function App() {
  return (
    <ScrollView className="flex-1 bg-background">
      <StatusBar style="auto" />
      
      {/* Header */}
      <View className="px-6 pt-16 pb-8">
        <Text className="text-3xl font-bold text-foreground">
          NEO Native Test
        </Text>
        <Text className="text-muted-foreground mt-2">
          Testing components with HeroUI Native patterns
        </Text>
      </View>
      
      {/* Tabs Demos */}
      <View className="px-6 py-4">
        <Text className="text-xl font-semibold text-foreground mb-4">
          Tabs (Solid/Pill)
        </Text>
        <TabsPillDemo />
      </View>
      
      <View className="px-6 py-4">
        <Text className="text-xl font-semibold text-foreground mb-4">
          Tabs (Underlined)
        </Text>
        <TabsUnderlinedDemo />
      </View>
      
      <View className="px-6 py-4">
        <Text className="text-xl font-semibold text-foreground mb-4">
          Tabs (Controlled with Color)
        </Text>
        <TabsColorsDemo />
      </View>
      
      {/* Divider */}
      <View className="h-px bg-border mx-6 my-4" />
      
      {/* Lucide Icons - Primary (Consistent with Web) */}
      <View className="px-6 py-4">
        <Text className="text-xl font-semibold text-foreground mb-4">
          Lucide Icons (Primary)
        </Text>
        <Text className="text-sm text-muted-foreground mb-3">
          Same icons as web - import from 'lucide-react-native'
        </Text>
        
        <View className="flex-row gap-4 mb-4">
          <Sun size={32} color="#3b82f6" />
          <Moon size={32} color="#22c55e" />
          <Home size={32} color="#f59e0b" />
          <Settings size={32} color="#ef4444" />
        </View>
        
        <View className="flex-row gap-4">
          <User size={32} color="#a855f7" />
          <Bell size={32} color="#06b6d4" />
          <Heart size={32} color="#ec4899" />
          <Star size={32} color="#eab308" />
        </View>
      </View>
      
      {/* DynamicIcon Fallback */}
      <View className="px-6 py-4">
        <Text className="text-xl font-semibold text-foreground mb-4">
          DynamicIcon (Fallback)
        </Text>
        <Text className="text-sm text-muted-foreground mb-3">
          For icons not in Lucide - uses @expo/vector-icons
        </Text>
        
        {/* Material Design Icons */}
        <View className="mb-4">
          <Text className="text-xs text-muted-foreground mb-2">
            Material Design (mdi:)
          </Text>
          <View className="flex-row gap-4">
            <DynamicIcon icon="mdi:home" size={32} color="#3b82f6" />
            <DynamicIcon icon="mdi:account" size={32} color="#22c55e" />
            <DynamicIcon icon="mdi:cog" size={32} color="#f59e0b" />
            <DynamicIcon icon="mdi:heart" size={32} color="#ef4444" />
          </View>
        </View>
        
        {/* Ionicons */}
        <View className="mb-4">
          <Text className="text-xs text-muted-foreground mb-2">
            Ionicons (ion:)
          </Text>
          <View className="flex-row gap-4">
            <DynamicIcon icon="ion:home" size={32} color="#3b82f6" />
            <DynamicIcon icon="ion:search" size={32} color="#22c55e" />
            <DynamicIcon icon="ion:notifications" size={32} color="#f59e0b" />
            <DynamicIcon icon="ion:person" size={32} color="#ef4444" />
          </View>
        </View>
      </View>
      
      {/* Size Variations */}
      <View className="px-6 py-4">
        <Text className="text-xl font-semibold text-foreground mb-4">
          Size Variations
        </Text>
        <View className="flex-row items-end gap-4">
          <Star size={16} color="#3b82f6" />
          <Star size={24} color="#3b82f6" />
          <Star size={32} color="#3b82f6" />
          <Star size={48} color="#3b82f6" />
        </View>
      </View>
      
      {/* Footer */}
      <View className="px-6 py-8 border-t border-border mt-4">
        <Text className="text-sm text-muted-foreground text-center">
          Primary: lucide-react-native • Fallback: @expo/vector-icons
        </Text>
      </View>
    </ScrollView>
  )
}
