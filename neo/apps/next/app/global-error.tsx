"use client";
import { useEffect, useState } from 'react'
import { trackError } from 'app/lib/analytics'

type Translations = Record<string, unknown>;

/** The language NEO stores for the visitor (web layout settings), else the browser's. */
const LANG_CODE_COOKIE = 'neo_lang_code';

function getVisitorLanguage(): string {
    const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${LANG_CODE_COOKIE}=`));
    let code = '';
    try {
        code = cookie ? decodeURIComponent(cookie.slice(LANG_CODE_COOKIE.length + 1)) : '';
    } catch {
        code = '';
    }
    return (code || navigator.language || 'en').toLowerCase().split('-')[0] || 'en';
}

/**
 * Replaces the root layout when it fails, so it renders its own document and needs nothing
 * the layout provides: no Providers (i18n, theme), no global styles. The text is English
 * until the translations (the lazy chunk `changeI18nLanguage` loads too) arrive, then the
 * visitor's language; the colours are the browser's light or dark system colours.
 */
export default function GlobalError({error, reset, retry}: {
    error: Error & { digest?: string };
    reset: () => void;
    retry?: () => void;
}) {
    const [text, setText] = useState<{ lang: string; translations?: Translations }>({ lang: 'en' });

    useEffect(() => {
        trackError(error, { kind: 'react', fatal: true });
    }, [error]);

    useEffect(() => {
        let active = true;
        import('app/customization/translation')
            .then(({ resources }) => {
                const lang = getVisitorLanguage();
                const bundle = (resources as Record<string, { translation?: Translations } | undefined>)[lang];
                if (active && bundle?.translation) setText({ lang, translations: bundle.translation });
            })
            .catch(() => {
                // the chunk failed to load: English stays
            });
        return () => {
            active = false;
        };
    }, []);

    const t = (key: string): string => {
        const value = text.translations?.[key];
        return typeof value === 'string' ? value : key;
    };
    const title = t('Something went wrong');

    return (
        <html lang={text.lang}>
            <body style={{ margin: 0, colorScheme: 'light dark', background: 'Canvas', color: 'CanvasText', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <title>{title}</title>
                <main style={{ boxSizing: 'border-box', minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.3 }}>{title}</h1>
                    <p style={{ margin: 0, maxWidth: 480, fontSize: 16, lineHeight: 1.5 }}>
                        {t('Something didn’t go as planned. Please try again or reload the page.')}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                        <button type="button" onClick={() => (retry ?? reset)()} style={{ minHeight: 44, padding: '0 20px', fontSize: 16, borderRadius: 8, cursor: 'pointer' }}>
                            {t('Retry')}
                        </button>
                        <button type="button" onClick={() => window.location.reload()} style={{ minHeight: 44, padding: '0 20px', fontSize: 16, borderRadius: 8, cursor: 'pointer' }}>
                            {t('Reload page')}
                        </button>
                    </div>
                </main>
            </body>
        </html>
    );
}
