import { parseDocument } from 'yaml'

const delimiterPattern = /^---[ \t]*$/

function stringValue(value: any) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function stringArray(value: any) {
    if (!Array.isArray(value)) return []

    const normalized = value.flatMap((item) => {
        const itemValue = stringValue(item)
        return itemValue ? [itemValue] : []
    })
    return [...new Set(normalized)]
}

function normalizeAttributes(value: any) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

    return {
        ...value,
        title: stringValue(value.title),
        description: stringValue(value.description),
        sourceCodeUrl: stringValue(value.sourceCodeUrl),
        packageName: stringValue(value.packageName),
        iconUrl: stringValue(value.iconUrl),
        platforms: stringArray(value.platforms),
        tags: stringArray(value.tags),
    }
}

export function parseFrontMatter(markdown: string) {
    const source = String(markdown || '').replace(/^\uFEFF/, '')
    const lines = source.split(/\r?\n/)

    if (!delimiterPattern.test(lines[0] || '')) {
        return { attributes: null, body: source, error: null }
    }

    const closingIndex = lines.findIndex(
        (line, index) => index > 0 && delimiterPattern.test(line),
    )
    if (closingIndex < 0) {
        return {
            attributes: null,
            body: source,
            error: new Error('Front matter is missing its closing --- delimiter.'),
        }
    }

    try {
        const document = parseDocument(lines.slice(1, closingIndex).join('\n'), {
            uniqueKeys: true,
        })
        if (document.errors.length) throw document.errors[0]

        const parsed = document.toJS({ maxAliasCount: 0 })
        return {
            attributes: normalizeAttributes(parsed),
            body: lines.slice(closingIndex + 1).join('\n').replace(/^\s*\n/, ''),
            error: null,
        }
    } catch (error) {
        return {
            attributes: null,
            body: source,
            error: error instanceof Error ? error : new Error(String(error)),
        }
    }
}

export function parseWikiFrontMatter(contents: any) {
    const markdownContents = Array.isArray(contents) ? contents : []
    const contentIndex = markdownContents.findIndex((content) => String(content || '').trim())
    if (contentIndex < 0) {
        return { attributes: null, contents: markdownContents, error: null }
    }

    const parsed = parseFrontMatter(markdownContents[contentIndex])
    if (!parsed.attributes) {
        return {
            attributes: null,
            contents: markdownContents,
            error: parsed.error,
        }
    }

    const nextContents = [...markdownContents]
    nextContents[contentIndex] = parsed.body

    return {
        attributes: parsed.attributes,
        contents: nextContents,
        error: null,
    }
}
