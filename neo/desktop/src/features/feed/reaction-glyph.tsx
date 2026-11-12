import type { Schema } from 'una-api';

import { Icon, isIconName } from '../../components/icon';
import { t } from '../../lib/i18n';

type Kind = Schema<'ReactionKinds'>['kinds'][number];
type Details = Schema<'ReactionKinds'>;

/**
 * How reactions are drawn. 'icon' (the default) draws a reaction's Lucide icon as NEO's web
 * client does (social_actions.reaction.icon_type_web 'svg'): the site's reactions, in its order,
 * each as the Lucide icon UNA's reaction list names (GET /reactions/details `icon`), and a
 * reaction the app has no icon for as its emoji, so emoji a site adds still show. 'emoji' draws
 * the emoji (NEO's native look), and 'site' follows GET /reactions/details `display`, the
 * classic site's own Icon / Emoji / Image choice in Studio, which UNA installs as Emoji.
 */
export const REACTION_LOOK: 'icon' | 'emoji' | 'site' = 'icon';

export type ReactionLook = 'icon' | 'emoji';

/** The look this app draws with, given what the site says. */
export function reactionLook(site: Details['display'] | undefined, setting: typeof REACTION_LOOK = REACTION_LOOK): ReactionLook {
    if (setting === 'site') return site === 'icon' ? 'icon' : 'emoji';
    return setting;
}

const EMOJI_CODE = /^e(?:_[0-9a-f]{1,6})+$/;

/**
 * The emoji of a freely picked reaction (UNA's Many mode keeps it as `e_<hex code points>`,
 * `e_1f98a` for 🦊, as BxDolVoteReactions::encodeEmoji and NEO's reaction-emoji.ts), or null.
 */
export function emojiFromReactionCode(name: string | null | undefined): string | null {
    if (!name || !EMOJI_CODE.test(name)) return null;
    const codes = name
        .split('_')
        .slice(1)
        .map((hex) => parseInt(hex, 16));
    if (codes.some((c) => c > 0x10ffff || (c >= 0xd800 && c <= 0xdfff))) return null;
    return String.fromCodePoint(...codes);
}

/**
 * The viewer's reaction as a kind to draw: one of the site's, or an emoji they picked freely
 * (Many mode), which is its emoji titled "Reacted" as in NEO; null for none (or one unknown).
 */
export function givenKind(kinds: readonly Kind[], reaction: string | null | undefined): Kind | null {
    if (!reaction) return null;
    const listed = kinds.find((k) => k.name === reaction);
    if (listed) return listed;
    const emoji = emojiFromReactionCode(reaction);
    return emoji ? { name: reaction, title: t('{{emoji}} Reacted', { emoji }), emoji, icon: null, color: null } : null;
}

/**
 * A reaction as the app draws it: its icon in icon mode (a kind without one the app bundles is
 * its emoji), else its emoji. Hidden from screen readers: the control around it says the title.
 */
export function ReactionGlyph({ kind, look, size = 16 }: { kind: Pick<Kind, 'emoji' | 'icon'>; look: ReactionLook; size?: 16 | 20 }) {
    const icon = kind.icon && isIconName(kind.icon) ? kind.icon : null;
    if (look === 'icon' && icon) {
        return (
            <span className="react-glyph react-icon" aria-hidden="true">
                <Icon name={icon} size={size} />
            </span>
        );
    }
    if (kind.emoji) {
        return (
            <span className="react-glyph act-emoji" aria-hidden="true">
                {kind.emoji}
            </span>
        );
    }
    return icon ? (
        <span className="react-glyph react-icon" aria-hidden="true">
            <Icon name={icon} size={size} />
        </span>
    ) : null;
}
