export const settingsWiki = {
    wiki: {
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
                    icon: 'Bot',
                    url: 'https://chatgpt.com/?q={prompt}',
                },
                codex: {
                    label: 'Open in Codex',
                    icon: 'SquareTerminal',
                    url: 'codex://threads/new?prompt={prompt}',
                },
                claude: {
                    label: 'Open in Claude',
                    icon: 'Sparkles',
                    url: 'claude://claude.ai/new?q={prompt}',
                },
                claude_code: {
                    label: 'Open in Claude Code',
                    icon: 'Terminal',
                    url: 'claude-cli://open?q={prompt}',
                },
                cursor: {
                    label: 'Open in Cursor',
                    icon: 'MousePointer2',
                    url: 'cursor://anysphere.cursor-deeplink/prompt?text={prompt}',
                },
            },
        },
    },
}
