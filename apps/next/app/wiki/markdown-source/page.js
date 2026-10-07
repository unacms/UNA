'use client'

import { useEffect, useState } from 'react'

const markdownSourceStoragePrefix = 'wiki-markdown-source:v1:'

export default function WikiMarkdownSourcePage() {
    const [markdown, setMarkdown] = useState(null)

    useEffect(() => {
        try {
            const storageKey = decodeURIComponent(window.location.hash.slice(1))
            if (!storageKey.startsWith(markdownSourceStoragePrefix)) {
                setMarkdown({ error: 'Markdown source is unavailable.' })
                return
            }

            const stored = window.localStorage.getItem(storageKey)
            window.localStorage.removeItem(storageKey)
            const payload = stored ? JSON.parse(stored) : null
            if (!payload || typeof payload.source !== 'string') {
                setMarkdown({ error: 'Markdown source is unavailable.' })
                return
            }

            document.title = `${payload.title || 'Document'} — Markdown`
            setMarkdown({ source: payload.source })
        } catch {
            setMarkdown({ error: 'Markdown source could not be opened.' })
        }
    }, [])

    if (!markdown) {
        return (
            <main className="min-h-screen bg-background p-6 text-foreground">
                Loading Markdown…
            </main>
        )
    }

    if (markdown.error) {
        return (
            <main className="min-h-screen bg-background p-6 text-foreground">
                {markdown.error}
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background p-4 text-foreground sm:p-6">
            <pre className="m-0 whitespace-pre-wrap break-words font-mono text-sm leading-6">
                {markdown.source}
            </pre>
        </main>
    )
}
