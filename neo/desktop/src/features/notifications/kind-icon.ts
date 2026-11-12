/**
 * The badge on a notification's avatar: what kind of thing happened, as an icon on a coloured
 * disc (spec 4.2). It is decorative; the notification's text says what happened. White on
 * every disc is measured at 4.70:1 or more (tokens.css --kind-*).
 */
import type { IconName } from '../../components/icon';

export type KindTone = 'accent' | 'heart' | 'green' | 'violet' | 'amber' | 'neutral';

export type KindBadge = { icon: IconName; tone: KindTone };

const COMMENT: KindBadge = { icon: 'message-square', tone: 'accent' };
const HEART: KindBadge = { icon: 'heart', tone: 'heart' };
const FOLLOW: KindBadge = { icon: 'user-round-check', tone: 'green' };
const FRIEND: KindBadge = { icon: 'user-plus', tone: 'green' };
const MENTION: KindBadge = { icon: 'at-sign', tone: 'violet' };
const REPOST: KindBadge = { icon: 'repeat-2', tone: 'accent' };
const GROUP: KindBadge = { icon: 'users-round', tone: 'amber' };
const MESSAGE: KindBadge = { icon: 'message-circle', tone: 'accent' };
const BELL: KindBadge = { icon: 'bell', tone: 'neutral' };

/** The notification kinds the API sends. */
const KINDS: Record<string, KindBadge> = {
    'graph.followed': FOLLOW,
    'graph.friend_requested': FRIEND,
    'graph.befriended': FRIEND,
    'social.reacted': HEART,
    'social.mentioned': MENTION,
    'social.comment': COMMENT,
    'social.reply': COMMENT,
    'discussions.reply': COMMENT,
    'groups.join_requested': GROUP,
    'groups.approved': GROUP,
    'groups.invited': GROUP,
    'invites.joined': FRIEND,
    'timeline.reposted': REPOST,
};

/**
 * `kind` is a kind of the shared vocabulary (social.comment); `other` and kinds this app does
 * not know yet fall back to `source`, UNA's `<module>.<action>` (bx_timeline.commentPost),
 * where the first rule that matches wins: a comment on someone else's post is still a comment.
 */
export function kindBadge(kind: string, source = ''): KindBadge {
    const known = KINDS[kind];
    if (known) return known;
    const dot = source.indexOf('.');
    const mod = dot < 0 ? source : source.slice(0, dot);
    const action = dot < 0 ? '' : source.slice(dot + 1);
    if (/comment|reply/i.test(action)) return COMMENT;
    if (/vote|react/i.test(action)) return HEART;
    if (mod === 'sys_profiles_subscriptions') return FOLLOW;
    if (mod === 'sys_profiles_friends') return FRIEND;
    if (/mention/i.test(mod) || /mention/i.test(action)) return MENTION;
    if (/repost/i.test(action)) return REPOST;
    if (mod === 'bx_groups') return GROUP;
    if (mod === 'bx_convos') return MESSAGE;
    return BELL;
}
