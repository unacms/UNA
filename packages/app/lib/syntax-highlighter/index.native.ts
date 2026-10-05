import { createNativeEngine, isNativeEngineAvailable } from 'react-native-shiki-engine'
import { createSyntaxHighlighter } from './create-highlighter'

export const highlightCode = createSyntaxHighlighter(() => {
    if (!isNativeEngineAvailable()) {
        throw new Error('The native Shiki engine is unavailable. Rebuild the Expo development client.')
    }
    return createNativeEngine()
})
