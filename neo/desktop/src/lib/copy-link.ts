import { errorMessage } from './errors';
import { t } from './i18n';
import { copyText } from './native';

/**
 * Copy an item's link, and say whether it was copied: both outcomes in the live region, or a
 * failure shown where the caller shows its errors (`fail`).
 */
export function useCopyLink(announce: (text: string) => void, fail: (text: string) => void = announce): (url: string) => void {
    return (url: string) =>
        void copyText(url).then(
            () => announce(t('Link copied')),
            (e: unknown) => fail(t('Could not copy the link: {{reason}}', { reason: errorMessage(e) })),
        );
}
