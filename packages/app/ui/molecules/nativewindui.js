import { Platform, Appearance } from 'react-native';
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'

import { TextInput as TextInputDef } from 'react-native'
import { useLayoutSettings } from 'app/context/layout-settings';

export default function ThemeCompatibilityTest({ data }) {
    const { themeName, setThemeName } = useLayoutSettings();
    

    return (
        <View className="gap-y-4">
            <Text className="text-xl font-bold text-foreground">
                🎨 NativewindUI Theme System Test
            </Text>

            <View className="space-y-2">
                <Text className="text-muted-foreground">
                    This component tests the new NativewindUI design system with semantic color tokens.
                </Text>
                <Text className="text-muted-foreground">
                    Current Theme: <Text className="font-semibold">{themeName || 'auto'}</Text>
                </Text>
            </View>

            {/* Theme Controls */}
            <View className='u-card'><Text className='u-text'>u-text inside u-card</Text></View>
            <TextInputDef className='u-input' placeholder='u-input inside u-card' />
            <TextInputDef className='u-input' placeholder='u-input inside u-card' />

            <Text className="text-lg font-semibold text-foreground"> Color Pallete</Text>

            <View className='w-full py-2 bg-background border items-center'><Text className="text-foregraund">background</Text></View>
            <View className='w-full py-2 bg-foreground border items-center'><Text className="text-background">foreground</Text></View>
            <View className='w-full py-2 bg-card border items-center'><Text className="foregraund">card</Text></View>
            <View className='w-full py-2 bg-card-foreground border items-center'><Text className="foregraund">card-foreground</Text></View>
            <View className='w-full py-2 bg-popover border items-center'><Text className="foregraund">popover</Text></View>
            <View className='w-full py-2 bg-popover-foreground border items-center'><Text className="popover-foreground">popover-foreground</Text></View>
            <View className='w-full py-2 bg-primary border items-center'><Text className="foregraund">primary</Text></View>
            <View className='w-full py-2 bg-primary-foreground border items-center'><Text className="foregraund">primary-foreground</Text></View>
            <View className='w-full py-2 bg-secondary border items-center'><Text className="foregraund">secondary</Text></View>
            <View className='w-full py-2 bg-secondary-foreground border items-center'><Text className="foregraund">secondary-foreground</Text></View>
            <View className='w-full py-2 bg-muted border items-center'><Text className="foregraund">muted</Text></View>
            <View className='w-full py-2 bg-muted-foreground border items-center'><Text className="foregraund">muted-foreground</Text></View>
            <View className='w-full py-2 bg-accent border items-center'><Text className="foregraund">accent</Text></View>
            <View className='w-full py-2 bg-accent-foreground border items-center'><Text className="foregraund">accent-foreground</Text></View>
            <View className='w-full py-2 bg-destructive border items-center'><Text className="foregraund">destructive</Text></View>
            <View className='w-full py-2 bg-destructive-foreground border items-center'><Text className="foregraund">destructive-foreground</Text></View>
            <View className='w-full py-2 bg-border border items-center'><Text className="foregraund">border</Text></View>
            <View className='w-full py-2 border/20 border items-center'><Text className="foregraund">input</Text></View>
            <View className='w-full py-2 bg-ring border items-center'><Text className="foregraund">ring</Text></View>
            <View className="flex-row space-x-2">
                <Pressable
                    onPress={() => setThemeName('light')}
                    className="bg-primary hover:bg-primary/50 px-4 py-2 rounded-lg"
                >
                    <Text className="text-primary-foreground font-medium">Light</Text>
                </Pressable>

                <Pressable
                    onPress={() => setThemeName('dark')}
                    className="bg-secondary px-4 py-2 rounded-lg"
                >
                    <Text className="text-secondary-foreground font-medium">Dark</Text>
                </Pressable>

                <Pressable
                    onPress={() => setThemeName('auto')}
                    className="bg-accent px-4 py-2 rounded-lg"
                >
                    <Text className="text-accent-foreground font-medium">Auto</Text>
                </Pressable>
            </View>

            {/* Color Test Cards */}
            <View className="space-y-3">
                <Text className="text-lg font-semibold text-foreground">Semantic Color Tokens</Text>

                {/* Background/Foreground Test */}
                <View className="bg-background border border-border rounded-lg p-4">
                    <Text className="text-foreground font-medium">Background & Foreground</Text>
                    <Text className="text-muted-foreground text-sm">
                        This uses bg-background and text-foreground tokens
                    </Text>
                </View>

                {/* Card Test */}
                <View className="bg-card border border-border rounded-lg p-4">
                    <Text className="text-card-foreground font-medium">Card Colors</Text>
                    <Text className="text-muted-foreground text-sm">
                        This uses bg-card and text-card-foreground tokens
                    </Text>
                </View>

                {/* Muted Test */}
                <View className="bg-muted border border-border rounded-lg p-4">
                    <Text className="text-muted-foreground font-medium">Muted Colors</Text>
                    <Text className="text-muted-foreground text-sm">
                        This uses bg-muted and text-muted-foreground tokens
                    </Text>
                </View>

                {/* Destructive Test */}
                <View className="bg-destructive border border-border rounded-lg p-4">
                    <Text className="text-destructive-foreground font-medium">Destructive Colors</Text>
                    <Text className="text-destructive-foreground text-sm">
                        This uses bg-destructive and text-destructive-foreground tokens
                    </Text>
                </View>

                {/* Old System Compatibility Test */}
                <View className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <Text className="text-black dark:text-white font-medium">Old System (for comparison)</Text>
                    <Text className="text-green-600 dark:text-green-400 text-sm">
                        ✅ If this text adapts to theme changes, the old system is working!
                    </Text>
                </View>

                {/* Status Indicator */}
                <View className="bg-card border border-border rounded-lg p-4">
                    <Text className="text-foreground font-medium">Theme System Status</Text>
                    <Text className="text-foreground text-sm">
                        🔍 <Text className="font-semibold">Watch for color changes</Text> when switching themes above.
                    </Text>
                    <Text className="text-muted-foreground text-sm mt-1">
                        All elements should adapt seamlessly using semantic tokens like bg-background, text-foreground, etc.
                    </Text>
                </View>
            </View>

            {/* Documentation */}
            <View className="bg-popover border border-border rounded-lg p-4">
                <Text className="text-popover-foreground font-medium mb-2">About This Test</Text>
                <Text className="text-muted-foreground text-sm">
                    • This component uses <Text className="font-mono">globals.css</Text> (NativewindUI system)
                </Text>
                <Text className="text-muted-foreground text-sm">
                    • The existing app uses <Text className="font-mono">global.css</Text> (legacy system)
                </Text>
                <Text className="text-muted-foreground text-sm">
                    • Both systems coexist through separate CSS imports
                </Text>
                <Text className="text-muted-foreground text-sm">
                    • Theme switching sets <Text className="font-mono">theme</Text> attribute on <Text className="font-mono">html</Text> element
                </Text>
            </View>
        </View>
    );
}