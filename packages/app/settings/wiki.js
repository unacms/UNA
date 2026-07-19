export const settingsWiki = {
    wiki: {
        // Client cache TTL for in-layout wiki navigations (sidebar).
        // Falls back to browse.stale_time when unset.
        page_cache_stale_ms: 5 * 60 * 1000,
        breadcrumb: {
            root_label: 'Docs',
            root_path: '/docs',
        },
        document_header: {
            icon_size: 48,
            platforms: {
                web: {
                    label: 'Web',
                    icon: 'Globe',
                    color: 'amber',
                },
                ios: {
                    label: 'iOS',
                    icon: 'Smartphone',
                    color: 'sky',
                },
                android: {
                    label: 'Android',
                    icon: 'Smartphone',
                    color: 'green',
                },
            },
            tag: {
                icon: 'Tag',
                color: 'neutral',
            },
            ai_prompt: 'Read this documentation page, so I can ask questions about it:\n\n{url}',
            ai_apps: {
                chatgpt: {
                    label: 'Open in ChatGPT',
                    icon: 'OpenAI',
                    url: 'https://chatgpt.com/?q={prompt}',
                },
                codex: {
                    label: 'Open in Codex',
                    icon: 'Codex',
                    url: 'codex://threads/new?prompt={prompt}',
                },
                claude: {
                    label: 'Open in Claude',
                    icon: 'Claude',
                    url: 'claude://claude.ai/new?q={prompt}',
                },
                claude_code: {
                    label: 'Open in Claude Code',
                    icon: 'ClaudeCode',
                    url: 'claude-cli://open?q={prompt}',
                },
                cursor: {
                    label: 'Open in Cursor',
                    icon: 'Cursor',
                    url: 'cursor://anysphere.cursor-deeplink/prompt?text={prompt}',
                },
            },
        },
    },
}
