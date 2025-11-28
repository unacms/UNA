import './global.css'
import { StatusBar } from 'expo-status-bar'
import { View, Text, ScrollView } from 'react-native'
import { Button } from '@neo/test-components'

export default function App() {
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />
      <ScrollView className="flex-1 p-6">
        <View className="pt-12 pb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">
            NEO Native Test
          </Text>
          <Text className="text-muted-foreground">
            Expo 54 + Uniwind + Shared Components
          </Text>
        </View>

        {/* Shared Button Component Demo */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-foreground mb-4">
            Shared Button Component
          </Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Same Button component used in webtest (Next.js), rendered with Uniwind
          </Text>
          
          <View className="gap-3">
            <Button variant="primary" onPress={() => console.log('Primary')}>
              Primary Button
            </Button>
            
            <Button variant="secondary" onPress={() => console.log('Secondary')}>
              Secondary Button
            </Button>
            
            <Button variant="destructive" onPress={() => console.log('Destructive')}>
              Destructive Button
            </Button>
            
            <Button variant="outline" onPress={() => console.log('Outline')}>
              Outline Button
            </Button>
            
            <Button variant="ghost" onPress={() => console.log('Ghost')}>
              Ghost Button
            </Button>

            <Button variant="primary" loading>
              Loading...
            </Button>

            <Button variant="primary" disabled>
              Disabled
            </Button>
          </View>
        </View>

        {/* Size Variants */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-foreground mb-4">
            Size Variants
          </Text>
          
          <View className="gap-3">
            <Button variant="primary" size="sm">
              Small Button
            </Button>
            
            <Button variant="primary" size="md">
              Medium Button
            </Button>
            
            <Button variant="primary" size="lg">
              Large Button
            </Button>
          </View>
        </View>

        {/* Info */}
        <View className="p-4 bg-card border border-border rounded-lg">
          <Text className="text-foreground font-semibold mb-2">
            Architecture Info
          </Text>
          <Text className="text-sm text-muted-foreground">
            • Expo SDK 54 with CNG{'\n'}
            • Uniwind for Tailwind 4 support{'\n'}
            • Shared @neo/test-components{'\n'}
            • Same theme tokens as webtest{'\n'}
            • Platform-specific .native.tsx files
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

