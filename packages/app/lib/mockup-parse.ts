/**
 * Parse UNA `mockup` block JSON into a render tree.
 *
 * Envelope (page JSON):
 *   block.content[] = { type: 'mockup', data: <tree> }
 *
 * `data` may be the tree, `{ tree }`, `{ node }`, or a JSON string.
 * Node types: view, row, text, image, icon, button.
 */

import { pickUnaDisplaySrc } from 'app/lib/image-helpers'

export const MOCKUP_MAX_DEPTH = 24

export const MOCKUP_NODE_TYPES: Record<string, any> = {
    view: true,
    row: true,
    text: true,
    image: true,
    icon: true,
    button: true,
}

const BUTTON_STYLE: Record<string, any> = {
    primary: 'borderedProminent',
    secondary: 'bordered',
    outline: 'bordered',
    bordered: 'bordered',
    borderedProminent: 'borderedProminent',
    plain: 'plain',
    link: 'link',
    glass: 'glass',
    glassProminent: 'glassProminent',
    borderless: 'borderless',
}

export function parseJsonValue(value: any) {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
        return JSON.parse(trimmed)
    } catch {
        return null
    }
}

function isNodeLike(value: any) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    return typeof value.type === 'string'
        || Array.isArray(value.children)
        || typeof value.text === 'string'
}

function unwrapPayload(payload: any, hops = 0) {
    if (hops > 8 || payload == null) return null

    const parsed = parseJsonValue(payload)
    if (parsed !== payload) return unwrapPayload(parsed, hops + 1)
    if (typeof parsed !== 'object') return null

    if (Array.isArray(parsed)) {
        return { type: 'view', children: parsed }
    }

    const itemType = parsed.type || parsed.content_type
    if (itemType === 'mockup') {
        return unwrapPayload(parsed.data ?? parsed.content ?? parsed.tree ?? parsed.node, hops + 1)
    }

    if (isNodeLike(parsed) && itemType !== 'service') return parsed

    const nested = parsed.data ?? parsed.content ?? parsed.tree ?? parsed.node
    if (nested != null && nested !== parsed) return unwrapPayload(nested, hops + 1)

    return parsed
}

function asClassName(value: any) {
    return typeof value === 'string' ? value : ''
}

function asChildren(value: any) {
    if (Array.isArray(value)) return value
    if (value == null || value === '') return []
    return [value]
}

function normalizeButtonStyle(value: any) {
    const key = String(value || 'primary')
    return BUTTON_STYLE[key] || BUTTON_STYLE.primary
}

function normalizeNode(raw: any, depth: number): any {
    if (depth > MOCKUP_MAX_DEPTH || raw == null) return null

    const parsed = parseJsonValue(raw)
    if (typeof parsed === 'string') {
        const text = parsed.trim()
        return text ? { type: 'text', className: '', text } : null
    }
    if (!parsed || typeof parsed !== 'object') return null

    if (Array.isArray(parsed)) {
        const children = parsed.map((child) => normalizeNode(child, depth + 1)).filter(Boolean)
        return children.length ? { type: 'view', className: '', children } : null
    }

    let type = parsed.type
    if (!type) {
        type = parsed.text != null && !parsed.children ? 'text' : 'view'
    } else if (!MOCKUP_NODE_TYPES[type]) {
        return null
    }
    const className = asClassName(parsed.className)
    const children = asChildren(parsed.children)
        .map((child) => normalizeNode(child, depth + 1))
        .filter(Boolean)

    if (type === 'text') {
        const text = parsed.text == null ? '' : String(parsed.text)
        if (!text) return null
        return { type, className, text }
    }

    if (type === 'icon') {
        const icon = String(parsed.icon || '')
        if (!icon) return null
        const size = Number(parsed.size)
        return { type, className, icon, size: Number.isFinite(size) && size > 0 ? size : 24 }
    }

    if (type === 'image') {
        const src = pickUnaDisplaySrc(parsed.src || parsed)
        if (!src) return null
        return { type, className, src, alt: parsed.alt == null ? '' : String(parsed.alt) }
    }

    if (type === 'button') {
        const label = String(parsed.label || parsed.text || '')
        if (!label) return null
        const href = String(parsed.href || '')
        return { type, className, label, href, style: normalizeButtonStyle(parsed.style || parsed.variant) }
    }

    if (!children.length) return null

    return { type, className, children }
}

/** @returns {object|null} Normalized tree, or null if the payload is empty/invalid. */
export function parseMockup(payload: any) {
    return normalizeNode(unwrapPayload(payload), 0)
}

export function isMockupEmpty(payload: any) {
    return !parseMockup(payload)
}
