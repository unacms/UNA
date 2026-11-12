import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useId, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { useApp } from '../../lib/context';
import { t } from '../../lib/i18n';
import { BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS } from '../../lib/rich-html';
import { useDraft, useDraftKey } from '../../lib/drafts';
import { useNavigation } from '../../lib/navigation';
import { isMac } from '../../lib/platform';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { useMyGroups, useMySpaces } from '../groups/groups';
import { type Changes, DiscussionFields, type FieldError, isSubmitKey } from './discussion-pane';
import { discussionKey, useDiscussionSetup } from './discussions';

type Audience = NonNullable<Schema<'NewDiscussion'>['audience']>;

const AUDIENCES: { value: Audience; label: string }[] = [
    { value: 'public', label: t('Everyone') },
    { value: 'members', label: t('Members of the network') },
    { value: 'friends', label: t('Friends') },
    { value: 'private', label: t('Only me') },
];

const isAudience = (v: unknown): v is Audience => AUDIENCES.some((a) => a.value === v);

/**
 * A new discussion in the detail pane: its title, text, category (when there is more than one)
 * and who can see it, or the group it goes in when it was started from one. What is typed is a
 * lasting draft (lib/drafts.ts, one per profile and group), so closing the pane, going elsewhere
 * or quitting throws nothing away; started, it becomes the discussion, and the lists show it.
 */
export function NewDiscussion({ groupId }: { groupId?: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    const setup = useDiscussionSetup();
    const groups = useMyGroups();
    // the context it goes in: one of one's groups or spaces
    const spaces = useMySpaces();
    const group = groupId ? (groups.data?.find((g) => g.id === groupId) ?? spaces.data?.find((g) => g.id === groupId)) : undefined;
    const categories = setup.data?.categories ?? [];
    const id = useId();
    const [value, setValue] = useState<Changes>({ title: '', body: '', categoryId: '' });
    const [audience, setAudience] = useState<Audience>('public');
    const [fieldError, setFieldError] = useState<FieldError | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    // the lasting draft, once read; another group starts over with its own
    const draftKey = useDraftKey(groupId ? `discussion-new:${groupId}` : 'discussion-new');
    const lasting = useDraft(draftKey);
    const [restoredFor, setRestoredFor] = useState<string | null | undefined>(undefined);
    if (lasting.loaded !== undefined && restoredFor !== draftKey) {
        setRestoredFor(draftKey);
        const d = lasting.loaded;
        setValue({ title: d?.title ?? '', body: d?.text ?? '', bodyHtml: d?.html, categoryId: d?.categoryId ?? '' });
        if (d && isAudience(d.audience)) setAudience(d.audience);
    }
    const restored = restoredFor === draftKey && lasting.loaded !== undefined;
    const { save } = lasting;
    useEffect(() => {
        if (!restored || sending) return;
        save({ title: value.title, text: value.body, html: value.bodyHtml, categoryId: value.categoryId || undefined, audience: groupId ? undefined : audience });
    }, [restored, sending, value.title, value.body, value.bodyHtml, value.categoryId, audience, groupId, save]);

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (sending) return;
        if (!value.title.trim()) {
            setFieldError({ field: 'title', text: t('Give it a title.') });
            document.getElementById(`${id}-title`)?.focus();
            return;
        }
        if (!value.body.trim()) {
            setFieldError({ field: 'body', text: t('Write what it is about.') });
            document.getElementById(`${id}-body`)?.focus();
            return;
        }
        setFieldError(null);
        // its HTML (formatting, mentions, pictures), or its plain text where discussions are sent as text
        const body: Schema<'NewDiscussion'> = BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS && value.bodyHtml ? { title: value.title.trim(), body_html: value.bodyHtml } : { title: value.title.trim(), body: value.body };
        const category = value.categoryId || categories[0]?.id;
        if (category) body.category_id = category;
        if (groupId) body.context_id = groupId;
        else body.audience = audience;
        // the route this was sent from: the person may go elsewhere while it sends
        const from = history.current;
        setSending(true);
        setError(null);
        const result = await api.POST('/discussions', { body });
        if (result.error !== undefined || !result.data) {
            setSending(false);
            setError(problemMessage(result.error, t('The discussion was not started')));
            return;
        }
        lasting.clear();
        const created = result.data;
        queryClient.setQueryData(discussionKey(created.id), created);
        void queryClient.invalidateQueries(['discussions', 'list']);
        // gone elsewhere meanwhile: this form (if still shown) starts over
        if (!replaceDetail({ kind: 'discussion', id: created.id }, from)) {
            setValue({ title: '', body: '', categoryId: '' });
            setSending(false);
        }
    };

    const where = group ? t('New discussion in {{group}}', { group: group.display_name }) : t('New discussion');
    const blocked = setup.data && !setup.data.can_create;
    return (
        <Pane pane="detail" title={where} actions={<CloseDetailButton />}>
            <div className="column settings">
                {setup.data === null ? (
                    <p className="muted">{t('This network has no discussions.')}</p>
                ) : blocked ? (
                    <p className="muted" role="status">
                        {t('You can’t start discussions in this network.')}
                    </p>
                ) : (
                    <form
                        className="settings-form discussion-form"
                        aria-labelledby="detail-title"
                        onSubmit={(e) => void submit(e)}
                        onKeyDown={(e) => {
                            if (!isSubmitKey(e)) return;
                            e.preventDefault();
                            void submit();
                        }}
                        noValidate
                    >
                        <DiscussionFields id={id} value={value} onChange={setValue} categories={categories} error={fieldError} autoFocus />
                        {groupId ? null : (
                            <div className="settings-field">
                                <label htmlFor={`${id}-audience`}>{t('Who can see it')}</label>
                                <select id={`${id}-audience`} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                                    {AUDIENCES.map((a) => (
                                        <option key={a.value} value={a.value}>
                                            {a.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {error ? (
                            <p className="error" role="alert">
                                {error}
                            </p>
                        ) : null}
                        <div className="settings-actions">
                            <span className="muted small" id={`${id}-kept`}>
                                {t('What you type is kept until you start it. {{keys}} starts it.', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                            </span>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                aria-disabled={sending || undefined}
                                aria-busy={sending || undefined}
                                aria-describedby={`${id}-kept`}
                                aria-keyshortcuts={isMac ? 'Meta+Enter' : 'Control+Enter'}
                            >
                                {t('Start discussion')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Pane>
    );
}
