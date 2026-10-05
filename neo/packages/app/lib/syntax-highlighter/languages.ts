const aliases: Record<string, string | null> = {
    bash: 'shellscript',
    cjs: 'javascript',
    css: 'css',
    diff: 'diff',
    html: 'html',
    htm: 'html',
    js: 'javascript',
    javascript: 'javascript',
    json: 'json',
    jsx: 'jsx',
    md: 'markdown',
    markdown: 'markdown',
    mjs: 'javascript',
    php: 'php',
    py: 'python',
    python: 'python',
    sh: 'shellscript',
    shell: 'shellscript',
    shellscript: 'shellscript',
    sql: 'sql',
    text: null,
    plaintext: null,
    txt: null,
    ts: 'typescript',
    tsx: 'tsx',
    typescript: 'typescript',
    xml: 'html',
    yaml: 'yaml',
    yml: 'yaml',
    zsh: 'shellscript',
}

const languageLoaders: Record<string, () => Promise<any>> = {
    css: () => import('@shikijs/langs/css').then((module) => module.default),
    diff: () => import('@shikijs/langs/diff').then((module) => module.default),
    html: () => import('@shikijs/langs/html').then((module) => module.default),
    javascript: () => import('@shikijs/langs/javascript').then((module) => module.default),
    json: () => import('@shikijs/langs/json').then((module) => module.default),
    jsx: () => import('@shikijs/langs/jsx').then((module) => module.default),
    markdown: () => import('@shikijs/langs/markdown').then((module) => module.default),
    php: () => import('@shikijs/langs/php').then((module) => module.default),
    python: () => import('@shikijs/langs/python').then((module) => module.default),
    shellscript: () => import('@shikijs/langs/shellscript').then((module) => module.default),
    sql: () => import('@shikijs/langs/sql').then((module) => module.default),
    tsx: () => import('@shikijs/langs/tsx').then((module) => module.default),
    typescript: () => import('@shikijs/langs/typescript').then((module) => module.default),
    yaml: () => import('@shikijs/langs/yaml').then((module) => module.default),
}

export function normalizeLanguage(language: string | null | undefined) {
    const value = String(language || '')
        .trim()
        .split(/\s+/, 1)[0]!
        .toLowerCase()
        .replace(/^language-/, '')

    if (!value || !Object.prototype.hasOwnProperty.call(aliases, value)) return null
    return aliases[value]
}

function inferLanguage(code: string) {
    const source = String(code || '').trim()
    if (!source) return null

    if (/^<\?php\b/i.test(source)) return 'php'
    if (/^(?:#!.*\b(?:ba|z|fi)?sh\b|\s*(?:\$ |(?:npm|yarn|pnpm|npx|git|curl)\s))/m.test(source)) return 'shellscript'
    if (/^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|WITH)\b/im.test(source)) return 'sql'
    if (/^\s*(?:def|class|from|import)\s+\w+.*:|^\s*print\s*\(/m.test(source)) return 'python'
    if (/^\s*(?:<!doctype\s+html|<html\b|<(?:div|span|p|section|main|article|body|head)\b)/i.test(source)) return 'html'

    if (/^[\[{]/.test(source)) {
        try {
            JSON.parse(source)
            return 'json'
        } catch {
            // Continue with code-oriented checks.
        }
    }

    const hasJsx = /<\/?[A-Z][\w.]*\b|<\/?[a-z][\w-]*\s+[^>]*\b(?:className|onClick)=/.test(source)
    const hasTypeScript = /\b(?:interface|type|enum|namespace|satisfies|implements)\s+\w+|\bas\s+const\b|:\s*(?:string|number|boolean|unknown|never|any)(?:\b|\[\])/.test(source)
    if (hasJsx && hasTypeScript) return 'tsx'
    if (hasTypeScript) return 'typescript'
    if (hasJsx) return 'jsx'
    if (/\b(?:const|let|var|function|class|import|export|async|await)\b|=>/.test(source)) return 'javascript'
    if (/^[^{}\n]+\{(?:[^{}]|\n)*\b[\w-]+\s*:\s*[^;{}]+;/m.test(source)) return 'css'

    return null
}

export function resolveLanguage(language: string | null | undefined, code: string) {
    const normalized = normalizeLanguage(language)
    if (normalized || String(language || '').trim()) return normalized
    return inferLanguage(code)
}

export function loadLanguage(language: string | null | undefined) {
    const loader = languageLoaders[language as string]
    return loader ? loader() : null
}
