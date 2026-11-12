import { t } from '../../lib/i18n';

/** What a form's uploads say of whether it can be sent (usePhotoUploads). */
type Sendable = { staging: () => boolean; blocker: string | null; ids: readonly string[] };

/**
 * Why a form with uploads can't be sent yet, or null. Files being made ready (picked or dropped,
 * not in the tray yet) hold it as ones that are uploading: sent now, it would go without them.
 * Then the tray's own reason (uploads on their way or failed), then `needed` when the form needs
 * at least one upload and has none (left out where it can go without: a new album).
 */
export function sendBlocker(uploads: Sendable, needed?: string): string | null {
    if (uploads.staging()) return t('Wait until the uploads are done');
    if (uploads.blocker !== null) return uploads.blocker;
    if (needed !== undefined && !uploads.ids.length) return needed;
    return null;
}

/** An answer as the uploads' `claim` asks of it: the site's data, or its error. */
type Answer<D> = { data?: D; error?: unknown };

/** What an all-or-nothing answer took of the uploads its request named: all of them, or none (refused). */
export function tookAll(answer: Answer<unknown>): boolean {
    return answer.error === undefined && !!answer.data;
}

/**
 * What an answer took of the `asked` uploads its request named, where the site may stop part of
 * the way (the membership level's limit): none (refused), all, or those its entries have (an
 * entry's media id is the upload's: the ones no entry has are those left).
 */
export function tookSome(answer: Answer<readonly { media?: { id: string } | null }[]>, asked: number): boolean | string[] {
    if (answer.error !== undefined || !answer.data) return false;
    if (answer.data.length >= asked) return true;
    return answer.data.flatMap((entry) => (entry.media ? [entry.media.id] : []));
}

/** The upload ids an answer took, of those its request `named`: all (true), none (false), or the ones it lists. */
export function takenOf(answer: boolean | readonly string[], named: readonly string[]): readonly string[] {
    if (answer === true) return named;
    if (answer === false) return [];
    return answer;
}
