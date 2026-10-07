import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import { createSyntaxHighlighter } from './create-highlighter'

export const highlightCode = createSyntaxHighlighter(() => createJavaScriptRegexEngine())
