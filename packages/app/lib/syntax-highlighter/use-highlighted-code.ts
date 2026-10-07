import { useEffect, useState } from 'react'
import { highlightCode } from './index'

export function useHighlightedCode(code: string, language: string | null | undefined, themeName: string) {
    const [tokens, setTokens] = useState<any>(null)

    useEffect(() => {
        let active = true
        setTokens(null)

        void highlightCode(code, language, themeName).then((nextTokens) => {
            if (active) setTokens(nextTokens)
        })

        return () => {
            active = false
        }
    }, [code, language, themeName])

    return tokens
}
