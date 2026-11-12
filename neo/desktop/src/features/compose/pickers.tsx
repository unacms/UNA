import { useQueryClient } from '@tanstack/react-query';

import type { Schema } from 'una-api';

import type { Audience } from '../../lib/drafts';
import { t } from '../../lib/i18n';
import { type Group, groupKey, postableGroups, useMyGroups } from '../groups/groups';

export const AUDIENCES: readonly { value: Audience; label: string }[] = [
    { value: 'public', label: t('Everyone') },
    { value: 'members', label: t('Members') },
    { value: 'friends', label: t('Friends') },
    { value: 'private', label: t('Only me') },
];

export function isAudience(v: unknown): v is Audience {
    return AUDIENCES.some((a) => a.value === v);
}

/** Who can see the post. A post in a context is seen by whom the context lets see it. */
export function AudiencePicker({ value, onChange, disabled, id }: { value: Audience; onChange: (a: Audience) => void; disabled?: boolean; id: string }) {
    return (
        <span className="picker">
            <label htmlFor={id} className="small muted">
                {t('Who can see it')}
            </label>
            <select
                id={id}
                value={value}
                disabled={disabled}
                title={disabled ? t('The group or event decides who sees posts in it') : undefined}
                onChange={(e) => {
                    if (isAudience(e.target.value)) onChange(e.target.value);
                }}
            >
                {AUDIENCES.map((a) => (
                    <option key={a.value} value={a.value}>
                        {a.label}
                    </option>
                ))}
            </select>
        </span>
    );
}

/**
 * Where a post can go besides one's own timeline: the groups one is in and may post in, as GET
 * /me/groups says (`viewer.can_post`). The chosen one (`contextId`, a draft's or the group the
 * sheet was opened from) is listed even before that list has it, from the group's own copy, if
 * that copy lets one post. `unavailable`: once one's groups are known, the chosen context is none
 * of them (a group left, or no longer open to one's posts), so the sheet must not send it.
 */
export function usePostContexts(contextId?: string | null): { contexts: readonly Schema<'Profile'>[]; unavailable: boolean } {
    const queryClient = useQueryClient();
    const mine = useMyGroups();
    const groups = postableGroups(mine.data);
    if (!contextId || groups.some((g) => g.id === contextId)) return { contexts: groups, unavailable: false };
    const chosen = queryClient.getQueryData<Group>(groupKey(contextId));
    if (chosen?.viewer?.can_post) return { contexts: [chosen, ...groups], unavailable: false };
    return { contexts: groups, unavailable: mine.isSuccess };
}

/** Post on one's own timeline or in a context. Shown only when there is a context to pick. */
export function ContextPicker({
    contexts,
    value,
    onChange,
    id,
}: {
    contexts: readonly Schema<'Profile'>[];
    value: string | null;
    onChange: (contextId: string | null) => void;
    id: string;
}) {
    if (!contexts.length) return null;
    return (
        <span className="picker">
            <label htmlFor={id} className="small muted">
                {t('Post to')}
            </label>
            <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">{t('Your timeline')}</option>
                {contexts.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.display_name}
                    </option>
                ))}
            </select>
        </span>
    );
}
