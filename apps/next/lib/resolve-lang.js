import { cookies, headers } from 'next/headers'
import { appSetting } from 'app/config'

const AVAILABLE_LANGS_SETTING_KEY = 'avaliable_langs'

const getCookieValue = (cookieString = '', name) => {
    return cookieString
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(name + '='))
        ?.split('=')
        .slice(1)
        .join('=') || ''
}

const decodeCookieValue = (value = '') => {
    try {
        return decodeURIComponent(value)
    } catch {
        return ''
    }
}

const normalizeLangCode = (value = '') => String(value)
    .toLowerCase()
    .split(/[-_]/)[0]

const resolveLangFromAcceptLanguage = (acceptLanguage = '') => {
    const configuredLangs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY)
    const supportedLangs = Array.isArray(configuredLangs)
        ? configuredLangs.filter((lang) => lang && lang !== 'auto')
        : ['en']
    const requestedLangs = acceptLanguage
        .split(',')
        .map((part) => normalizeLangCode(part.split(';')[0]?.trim()))
        .filter(Boolean)

    return requestedLangs.find((lang) => supportedLangs.includes(lang)) || supportedLangs[0] || 'en'
}

/** Server-only: same cookie/header rules as [...path]/page.js UNA fetches. */
export async function resolveServerLangCode() {
    const cookieStore = await cookies()
    const hdrs = await headers()
    const cookieString = cookieStore.getAll()
        .map((item) => item.name + '=' + encodeURIComponent(item.value))
        .join('; ')

    const langMode = decodeCookieValue(getCookieValue(cookieString, 'neo_lang'))
    const cookieLangCode = decodeCookieValue(getCookieValue(cookieString, 'neo_lang_code'))

    if (cookieLangCode) {
        return cookieLangCode
    }

    if (langMode && langMode !== 'auto') {
        return langMode
    }

    return resolveLangFromAcceptLanguage(hdrs?.get('accept-language') || '')
}
