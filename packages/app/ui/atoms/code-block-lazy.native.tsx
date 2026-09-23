import { lazy, Suspense } from 'react'
import { ScrollView, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { resolveLanguage } from 'app/lib/syntax-highlighter/languages'
import type { CodeBlockProps } from './code-block.types'

const CodeBlock = lazy(() => import('./code-block'))

function CodeBlockFallback({ code, language }: CodeBlockProps) {
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
                        {code}
                    </Text>
                </View>
            </ScrollView>
        </View>
    )
}

export default function LazyCodeBlock(props: CodeBlockProps) {
    const language = resolveLanguage(props.language, props.code)
    if (!language) {
        return <CodeBlockFallback {...props} />
    }

    return (
        <Suspense fallback={<CodeBlockFallback {...props} />}>
            <CodeBlock {...props} language={language} />
        </Suspense>
    )
}
