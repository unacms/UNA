import { ScrollView, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useThemeName } from 'app/design/theme'
import { useHighlightedCode } from 'app/lib/syntax-highlighter/use-highlighted-code'

function tokenStyle(token) {
    const decoration = []
    if (token.fontStyle & 4) decoration.push('underline')
    if (token.fontStyle & 8) decoration.push('line-through')

    return {
        color: token.color,
        fontStyle: token.fontStyle & 1 ? 'italic' : 'normal',
        fontWeight: token.fontStyle & 2 ? '700' : '400',
        textDecorationLine: decoration.length ? decoration.join(' ') : 'none',
    }
}

export default function CodeBlock({ code, language }) {
    const themeName = useThemeName() === 'dark' ? 'dark' : 'light'
    const tokens = useHighlightedCode(code, language, themeName)

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
