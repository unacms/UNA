import { useEffect, useState } from 'react'
import { highlightCode } from './index'

export function useHighlightedCode(code, language, themeName) {
    const [tokens, setTokens] = useState(null)

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
