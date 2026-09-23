import { ScrollView, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import type { TextStyle } from 'react-native'
import { useThemeValue } from 'app/design/theme'
import { useHighlightedCode } from 'app/lib/syntax-highlighter/use-highlighted-code'
import type { CodeBlockProps, HighlightToken } from './code-block.types'

function tokenStyle(token: HighlightToken): TextStyle {
    const flags = token.fontStyle ?? 0
    const decoration: string[] = []
    if (flags & 4) decoration.push('underline')
    if (flags & 8) decoration.push('line-through')

    return {
        color: token.color,
        fontStyle: flags & 1 ? 'italic' : 'normal',
        fontWeight: flags & 2 ? '700' : '400',
        textDecorationLine: (decoration.length ? decoration.join(' ') : 'none') as TextStyle['textDecorationLine'],
    }
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
    const themeName = useThemeValue('light', 'dark')
    const tokens = useHighlightedCode(code, language, themeName) as HighlightToken[][] | null

    return (
        <View
            accessible
            accessibilityLabel={language ? `${language} code block` : 'Code block'}
            className="my-3 max-w-full overflow-hidden rounded-lg border border-border bg-muted/50"
        >
            <ScrollView horizontal showsHorizontalScrollIndicator>
                <View className="p-3">
                    <Text
                        selectable
                        fontFamily="font-mono"
                        className="text-sm leading-5 text-foreground"
                    >
                        {tokens
                            ? tokens.map((line, lineIndex) => (
                                <Text key={`line-${lineIndex}`} fontFamily="font-mono">
                                    {line.map((token, tokenIndex) => (
                                        <Text
                                            key={`token-${lineIndex}-${tokenIndex}`}
                                            fontFamily="font-mono"
                                            style={tokenStyle(token)}
                                        >
                                            {token.content}
                                        </Text>
                                    ))}
                                    {lineIndex < tokens.length - 1 ? '\n' : ''}
                                </Text>
                            ))
                            : code}
                    </Text>
                </View>
            </ScrollView>
        </View>
    )
}
