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

export function resolveLangCode(cookieString = '', acceptLanguage = '') {
    const langMode = decodeCookieValue(getCookieValue(cookieString, 'neo_lang'))
    const cookieLangCode = decodeCookieValue(getCookieValue(cookieString, 'neo_lang_code'))

    if (cookieLangCode) {
        return cookieLangCode
    }

    if (langMode && langMode !== 'auto') {
        return langMode
    }

    // First visit: follow the same default the client applies in
    // layout-settings hydrate(), or the client switches language mid-hydration
    // and React throws away the server HTML (#418). Accept-Language only when
    // the default is 'auto' (the client then reads navigator.languages).
    const defaultLang = appSetting('layout', 'defaults')?.lang
    if (defaultLang && defaultLang !== 'auto') {
        return defaultLang
    }

    return resolveLangFromAcceptLanguage(acceptLanguage)
}

export async function resolveServerLangCode() {
    const [cookieStore, hdrs] = await Promise.all([cookies(), headers()])
    const cookieString = cookieStore.getAll()
        .map((item) => item.name + '=' + encodeURIComponent(item.value))
        .join('; ')

    return resolveLangCode(cookieString, hdrs.get('accept-language') || '')
}
