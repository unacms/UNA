/**
 * What a detail says when what it was opened for can't be shown: deleted (404, 410) or not for
 * this viewer (403). One wording for posts and discussions, so a 403 never guesses a reason the
 * site did not give.
 */
import type { IconName } from '../components/icon';
import { ApiError } from './api';
import { t } from './i18n';

export type GoneWords = { title: string; hint: string; icon: IconName };

/**
 * The titles as whole sentences, by the noun the panes name (an id here, never shown by itself):
 * another language gives each noun its own gender and case. A noun not listed gets the sentence
 * with the noun put in.
 */
const CANT_SEE: Record<string, string> = {
    post: t('You can’t see this post'),
    discussion: t('You can’t see this discussion'),
    task: t('You can’t see this task'),
    poll: t('You can’t see this poll'),
    video: t('You can’t see this video'),
    photo: t('You can’t see this photo'),
    album: t('You can’t see this album'),
    file: t('You can’t see this file'),
};
const IS_GONE: Record<string, string> = {
    post: t('This post is gone'),
    discussion: t('This discussion is gone'),
    task: t('This task is gone'),
    poll: t('This poll is gone'),
    video: t('This video is gone'),
    photo: t('This photo is gone'),
    album: t('This album is gone'),
    file: t('This file is gone'),
};

/**
 * `noun` is what it is ("post", "discussion"), `icon` the one shown when it was deleted.
 * `inGroup`: it is known to be in a group (the site refuses it for not being a member), so the
 * hint can say so; otherwise a 403 is any audience the author chose.
 */
export function goneWords(error: unknown, noun: string, icon: IconName, inGroup = false): GoneWords {
    if (error instanceof ApiError && error.status === 403)
        return { title: CANT_SEE[noun] ?? t('You can’t see this {{noun}}', { noun }), hint: inGroup ? t('It is in a group you are not in.') : t('Its author shares it with some people only.'), icon: 'lock' };
    return { title: IS_GONE[noun] ?? t('This {{noun}} is gone', { noun }), hint: t('It was deleted, or you can’t see it any more.'), icon };
}
