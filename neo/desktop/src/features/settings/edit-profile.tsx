import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { Avatar } from '../../components/avatar';
import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { useMediaSrc } from '../../lib/media';
import { pictureOf } from '../feed/media';
import { useNavigation } from '../../lib/navigation';
import { makeUploader, photoUploader, type Picked } from '../../lib/uploads';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { profileKey, profileSummaryKey } from '../profile/graph';

type Profile = Schema<'Profile'>;
type Media = Schema<'Media'>;
type Changes = Schema<'ProfileChanges'>;
type FieldErrors = Partial<Record<keyof Changes | 'form', string>>;

/** A picture or cover: as it is, a new upload, or taken off. */
type ImageChange = { kind: 'keep' } | { kind: 'new'; media: Media } | { kind: 'remove' };

/** What the form changes, only what differs from the profile. */
export function profileChanges(profile: Pick<Profile, 'display_name' | 'about'>, form: { name: string; about: string; avatar: ImageChange; cover: ImageChange }): Changes {
    const changes: Changes = {};
    const name = form.name.trim();
    if (name !== profile.display_name) changes.display_name = name;
    if (form.about.trim() !== profile.about.trim()) changes.about = form.about.trim();
    if (form.avatar.kind === 'new') changes.avatar_id = form.avatar.media.id;
    if (form.avatar.kind === 'remove') changes.avatar_id = null;
    if (form.cover.kind === 'new') changes.cover_id = form.cover.media.id;
    if (form.cover.kind === 'remove') changes.cover_id = null;
    return changes;
}

/** The site's reasons, by field. */
function fieldErrors(error: unknown): FieldErrors {
    const errors = (error as { errors?: { field?: string; message?: string }[] } | undefined)?.errors ?? [];
    const out: FieldErrors = {};
    for (const e of errors) {
        const field = e.field === 'display_name' || e.field === 'about' || e.field === 'avatar_id' || e.field === 'cover_id' ? e.field : 'form';
        out[field] = out[field] ? `${out[field]} ${e.message ?? ''}` : (e.message ?? t('Not accepted'));
    }
    if (!errors.length) out.form = problemMessage(error, t('The profile was not saved'));
    return out;
}

function ImageField({
    id,
    label,
    current,
    change,
    onPick,
    onRemove,
    onKeep,
    busy,
    error,
    disabled,
    wide,
}: {
    id: string;
    label: string;
    current: string | null | undefined;
    change: ImageChange;
    onPick: () => void;
    onRemove: () => void;
    onKeep: () => void;
    busy: boolean;
    error?: string;
    disabled?: string;
    wide?: boolean;
}) {
    const allowed = useMediaSrc();
    const shown = change.kind === 'new' ? pictureOf(change.media, 'thumb', allowed) : change.kind === 'remove' ? null : allowed(current);
    const state = change.kind === 'new' ? t('New, saved with the profile') : change.kind === 'remove' ? t('Taken off when you save') : shown ? '' : t('None');
    return (
        <fieldset className="settings-fieldset image-field" aria-describedby={`${id}-state${error ? ` ${id}-error` : ''}`}>
            <legend>{label}</legend>
            <div className={wide ? 'image-preview image-preview-wide' : 'image-preview'}>{shown ? <img src={shown} alt="" /> : <span aria-hidden="true" />}</div>
            <p id={`${id}-state`} className="small muted">
                {disabled ?? state}
            </p>
            {disabled ? null : (
                <div className="settings-actions">
                    <button type="button" id={`${id}-pick`} className="btn small" onClick={onPick} aria-disabled={busy || undefined} aria-busy={busy || undefined}>
                        {busy ? t('Uploading…') : t(`Choose a photo`)}
                    </button>
                    {change.kind !== 'keep' ? (
                        <button type="button" className="btn btn-quiet small" onClick={onKeep}>
                            {t('Keep the one I have')}
                        </button>
                    ) : shown ? (
                        <button type="button" className="btn btn-quiet small" onClick={onRemove}>
                            {t('Take it off')}
                        </button>
                    ) : null}
                </div>
            )}
            {error ? (
                <p id={`${id}-error`} className="error small" role="alert">
                    {error}
                </p>
            ) : null}
        </fieldset>
    );
}

/**
 * Edit a profile of one's own (PATCH /profiles/{id}): its name, about, picture and cover.
 * Pictures upload with the purpose `profile`, which the site keeps for the acting profile's
 * module, so they can be changed for the acting profile only (others: switch to it first).
 */
export function EditProfile({ id }: { id: string }) {
    const { api, me } = useApp();
    const queryClient = useQueryClient();
    const { history, openDetail, closeDetail } = useNavigation();
    const profile = useQuery({ queryKey: profileKey(id), queryFn: async () => unwrap(await api.GET('/profiles/{id}', { params: { path: { id } } })) });
    const own = me.profiles.some((p) => p.id === id);
    const acting = me.active_profile_id === id;

    const [name, setName] = useState('');
    const [about, setAbout] = useState('');
    const [avatar, setAvatar] = useState<ImageChange>({ kind: 'keep' });
    const [cover, setCover] = useState<ImageChange>({ kind: 'keep' });
    const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [status, setStatus] = useState('');
    const filled = useRef(false);
    const uploader = useMemo(() => photoUploader(makeUploader(api), 'profile'), [api]);

    useEffect(() => {
        if (!profile.data || filled.current) return;
        filled.current = true;
        setName(profile.data.display_name);
        setAbout(profile.data.about);
    }, [profile.data]);

    // an upload no save took is deleted (the site would after its ghost lifetime anyway)
    const dropUpload = (c: ImageChange) => {
        if (c.kind === 'new') void api.DELETE('/uploads/{id}', { params: { path: { id: c.media.id } } }).catch(() => undefined);
    };

    const pick = async (which: 'avatar' | 'cover') => {
        if (uploading || saving) return;
        let file: Picked | undefined;
        try {
            const staging = await uploader.pick();
            file = staging.files[0];
            staging.files.slice(1).forEach((f) => uploader.release(f));
            if (!file) {
                if (staging.refused.length) setErrors((e) => ({ ...e, [which === 'avatar' ? 'avatar_id' : 'cover_id']: t('Choose a photo') }));
                return;
            }
        } catch (e) {
            setStatus(errorMessage(e));
            return;
        }
        setUploading(which);
        setStatus(t('Uploading {{name}}…', { name: file.name }));
        try {
            const media = await uploader.upload(file, () => undefined);
            const set = which === 'avatar' ? setAvatar : setCover;
            set((before) => {
                dropUpload(before);
                return { kind: 'new', media };
            });
            setErrors((e) => ({ ...e, [which === 'avatar' ? 'avatar_id' : 'cover_id']: undefined }));
            setStatus(t('{{name}} is ready; save to use it', { name: file.name }));
        } catch (e) {
            setErrors((er) => ({ ...er, [which === 'avatar' ? 'avatar_id' : 'cover_id']: errorMessage(e) }));
            setStatus('');
        } finally {
            uploader.release(file);
            setUploading(null);
        }
    };

    if (!own) {
        return (
            <Pane pane="detail" title={t('Edit profile')} actions={<CloseDetailButton />}>
                <div className="column">
                    <p role="alert">{t('You can edit only the profiles of your own account.')}</p>
                </div>
            </Pane>
        );
    }

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (saving || uploading || !profile.data) return;
        const changes = profileChanges(profile.data, { name, about: profile.data.about_truncated ? profile.data.about : about, avatar, cover });
        if (!name.trim()) {
            setErrors({ display_name: t('A profile needs a name') });
            document.getElementById('edit-name')?.focus();
            return;
        }
        if (!Object.keys(changes).length) {
            setStatus(t('Nothing to save'));
            return;
        }
        setSaving(true);
        setErrors({});
        setStatus(t('Saving…'));
        try {
            const result = await api.PATCH('/profiles/{id}', { params: { path: { id } }, body: changes });
            if (result.error !== undefined || !result.response.ok) {
                let found = fieldErrors(result.error);
                // a 409 is about the about (formatted, or longer than the app gets)
                if (result.response.status === 409 && !found.about) found = { about: found.form };
                setErrors(found);
                setStatus('');
                const first = found.display_name ? 'edit-name' : found.about ? 'edit-about' : found.avatar_id ? 'edit-avatar-pick' : found.cover_id ? 'edit-cover-pick' : null;
                if (first) document.getElementById(first)?.focus();
                return;
            }
            const saved = result.data as Profile;
            queryClient.setQueryData(profileKey(id), saved);
            queryClient.setQueryData(profileSummaryKey(id), (old: Schema<'Profile'> | undefined) => (old ? { ...old, display_name: saved.display_name, avatar: saved.avatar } : old));
            void queryClient.invalidateQueries(['me']);
            setAvatar({ kind: 'keep' });
            setCover({ kind: 'keep' });
            setName(saved.display_name);
            setAbout(saved.about);
            setStatus(saved.status === 'pending' ? t('Saved. The site checks profile changes: the profile waits for approval') : t('Profile saved'));
        } catch (err) {
            setErrors({ form: errorMessage(err) });
            setStatus('');
        } finally {
            setSaving(false);
        }
    };

    // back where it was opened: Settings' Account beside Settings, else the aside closes (it
    // opened beside one's profile page, which stays; Settings never opens beside it)
    const cancel = () => {
        dropUpload(avatar);
        dropUpload(cover);
        if (history.current.list.section === 'settings') openDetail({ kind: 'settings', tab: 'account' });
        else closeDetail();
    };

    const title = profile.data ? t('Edit {{name}}', { name: profile.data.display_name }) : t('Edit profile');
    // the site sends only the start of a long about: editing that would replace the whole of it
    const aboutCut = !!profile.data?.about_truncated;
    const noImages = acting ? undefined : t('Act as this profile to change its pictures (Settings, Account).');

    return (
        <Pane pane="detail" title={title} actions={<CloseDetailButton />} busy={profile.isLoading}>
            <div className="column settings">
                {profile.isError ? (
                    <p className="error" role="alert">
                        {errorMessage(profile.error)}
                    </p>
                ) : !profile.data ? (
                    <p className="muted">{t('Loading…')}</p>
                ) : (
                    <form className="settings-form" onSubmit={(e) => void submit(e)} noValidate>
                        <div className="settings-head">
                            <Avatar profile={profile.data} size={48} />
                            {/* the handle, as the profile shows it (6.2): not the site's long address */}
                            {profile.data.handle ? (
                                <span className="small muted handle" dir="auto">
                                    @{profile.data.handle}
                                </span>
                            ) : null}
                        </div>
                        <div className="settings-field">
                            <label htmlFor="edit-name">{t('Name')}</label>
                            <input
                                id="edit-name"
                                value={name}
                                maxLength={255}
                                required
                                aria-invalid={errors.display_name ? true : undefined}
                                aria-describedby={errors.display_name ? 'edit-name-error' : undefined}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                            {errors.display_name ? (
                                <p id="edit-name-error" className="error small">
                                    {errors.display_name}
                                </p>
                            ) : null}
                        </div>
                        <div className="settings-field">
                            <label htmlFor="edit-about">{t('About')}</label>
                            <textarea
                                id="edit-about"
                                rows={5}
                                value={about}
                                maxLength={10000}
                                readOnly={aboutCut}
                                aria-invalid={errors.about ? true : undefined}
                                aria-describedby={`edit-about-hint${errors.about ? ' edit-about-error' : ''}`}
                                onChange={(e) => setAbout(e.target.value)}
                            />
                            <p id="edit-about-hint" className="small muted">
                                {aboutCut
                                    ? t('This about is longer than the app shows, so it is edited on the site: saving here would cut it.')
                                    : t('Plain text; each line is a paragraph. An about with links or formatting is edited on the site.')}
                            </p>
                            {errors.about ? (
                                <p id="edit-about-error" className="error small">
                                    {errors.about}
                                </p>
                            ) : null}
                        </div>
                        <ImageField
                            id="edit-avatar"
                            label={t('Picture')}
                            current={profile.data.avatar}
                            change={avatar}
                            busy={uploading === 'avatar'}
                            error={errors.avatar_id}
                            disabled={noImages}
                            onPick={() => void pick('avatar')}
                            onRemove={() => setAvatar({ kind: 'remove' })}
                            onKeep={() => {
                                dropUpload(avatar);
                                setAvatar({ kind: 'keep' });
                            }}
                        />
                        <ImageField
                            id="edit-cover"
                            label={t('Cover')}
                            current={profile.data.cover}
                            change={cover}
                            busy={uploading === 'cover'}
                            error={errors.cover_id}
                            disabled={noImages}
                            wide
                            onPick={() => void pick('cover')}
                            onRemove={() => setCover({ kind: 'remove' })}
                            onKeep={() => {
                                dropUpload(cover);
                                setCover({ kind: 'keep' });
                            }}
                        />
                        {errors.form ? (
                            <p className="error" role="alert">
                                {errors.form}
                            </p>
                        ) : null}
                        <div className="settings-actions">
                            <button type="submit" className="btn btn-primary" aria-disabled={saving || !!uploading || undefined} aria-busy={saving || undefined}>
                                {t('Save')}
                            </button>
                            <button type="button" className="btn" onClick={cancel}>
                                {t('Back to Account')}
                            </button>
                        </div>
                        <p className="small muted settings-status" role="status" aria-live="polite">
                            {status}
                        </p>
                    </form>
                )}
            </div>
        </Pane>
    );
}
