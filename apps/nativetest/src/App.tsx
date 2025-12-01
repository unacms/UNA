/**
 * NEO Native Test App
 * 
 * Demonstrates icon usage with:
 * - Lucide React Native (primary, consistent with web)
 * - DynamicIcon fallback for other icon sets
 */

import { StatusBar } from 'expo-status-bar'
import { View, Text, ScrollView } from 'react-native'
import { Sun, Moon, Home, Settings, User, Bell, Heart, Star } from 'lucide-react-native'
import { DynamicIcon } from './components/Icon'
import './global.css'

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
          Testing Lucide icons (same as web)
        </Text>
      </View>
      
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
