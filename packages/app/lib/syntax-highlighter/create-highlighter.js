import { createHighlighterCore } from '@shikijs/core'
import { loadLanguage, resolveLanguage } from './languages'

const MAX_CACHE_ENTRIES = 100

const themeLoaders = {
    dark: () => import('@shikijs/themes/github-dark').then((module) => module.default),
    light: () => import('@shikijs/themes/github-light').then((module) => module.default),
}

function trimCache(cache) {
    while (cache.size > MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value
        cache.delete(oldestKey)
    }
}

export function createSyntaxHighlighter(createEngine) {
    const tokenCache = new Map()
    const languagePromises = new Map()
    const themePromises = new Map()
    let highlighterPromise

    const getHighlighter = () => {
        if (!highlighterPromise) {
            highlighterPromise = createHighlighterCore({
                engine: createEngine(),
                langs: [],
                themes: [],
            })
        }
        return highlighterPromise
    }

    const ensureLanguage = async (highlighter, language) => {
        if (!languagePromises.has(language)) {
            const promise = Promise.resolve(loadLanguage(language))
                .then((definition) => {
                    if (!definition) throw new Error(`Unsupported syntax language: ${language}`)
                    return highlighter.loadLanguage(definition)
                })
                .catch((error) => {
                    languagePromises.delete(language)
                    throw error
                })
            languagePromises.set(language, promise)
        }
        await languagePromises.get(language)
    }

    const ensureTheme = async (highlighter, themeName) => {
        if (!themePromises.has(themeName)) {
            const promise = themeLoaders[themeName]()
                .then((definition) => highlighter.loadTheme(definition))
                .catch((error) => {
                    themePromises.delete(themeName)
                    throw error
                })
            themePromises.set(themeName, promise)
        }
        await themePromises.get(themeName)
    }

    return async function highlightCode(code, rawLanguage, rawThemeName) {
        const language = resolveLanguage(rawLanguage, code)
        if (!language) return null

        const themeName = rawThemeName === 'dark' ? 'dark' : 'light'
        const source = String(code ?? '')
        const cacheKey = `${themeName}\u0000${language}\u0000${source}`
        const cached = tokenCache.get(cacheKey)
        if (cached) {
            tokenCache.delete(cacheKey)
            tokenCache.set(cacheKey, cached)
            return cached
        }

        try {
            const highlighter = await getHighlighter()
            await Promise.all([
                ensureLanguage(highlighter, language),
                ensureTheme(highlighter, themeName),
            ])

            const tokens = highlighter.codeToTokensBase(source, {
                lang: language,
                theme: themeName === 'dark' ? 'github-dark' : 'github-light',
            }).map((line) => line.map((token) => ({
                color: token.color,
                content: token.content,
                fontStyle: token.fontStyle || 0,
            })))

            tokenCache.set(cacheKey, tokens)
            trimCache(tokenCache)
            return tokens
        } catch {
            return null
        }
    }
}
