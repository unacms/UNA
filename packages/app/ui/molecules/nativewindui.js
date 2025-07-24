import { Platform, Appearance } from 'react-native';
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { useThemeName } from 'app/design/theme';
import { TextInput as TextInputDef } from 'react-native'

export default function ThemeCompatibilityTest({ data }) {
    const { themeName, setThemeName } = useThemeName();

    // Handle theme switching (updated to work with CSS selectors)
    const handleTheme = async (item) => {
        if (Platform.OS === 'web') {
            const root = window.document.documentElement;
            if (item === 'auto') {
                // Remove theme attribute to let media query take over
                root.removeAttribute('theme');
                setThemeName('');
            } else {
                // Set explicit theme (light or dark)
                root.setAttribute('theme', item);
                setThemeName(item);
            }
        } else {
            if (item === 'auto') item = null;
            Appearance.setColorScheme(item);
            setThemeName(item);
        }
    };

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
            <View className="flex-row space-x-2">
                <Pressable
                    onPress={() => handleTheme('light')}
                    className="bg-primary px-4 py-2 rounded-lg"
                >
                    <Text className="text-primary-foreground font-medium">Light</Text>
                </Pressable>

                <Pressable
                    onPress={() => handleTheme('dark')}
                    className="bg-secondary px-4 py-2 rounded-lg"
                >
                    <Text className="text-secondary-foreground font-medium">Dark</Text>
                </Pressable>

                <Pressable
                    onPress={() => handleTheme('auto')}
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