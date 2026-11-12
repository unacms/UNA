/**
 * Making, renaming and deleting a context's task lists, as the site's Tasks page does (its list
 * form; deleting is its administrators'): New list and Rename open a small dialog for the name,
 * Delete asks first. The Tasks board, its Lists column, the sidebar and a context's Tasks tab
 * share them through useTaskListActions.
 */
import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type ReactNode, useId, useState } from 'react';

import { Dialog } from '../../components/dialog';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import type { MenuEntry } from '../../lib/native-menu';
import { useNavigation, useRoute } from '../../lib/navigation';
import { tasksPage } from '../../lib/router';
import { createTaskList, deleteTaskList, renameTaskList, type TaskList, TITLE_MAX, TITLE_MIN, titleProblem } from './tasks';

/** A list of its own (not the Inbox, which has no id and can't be renamed or deleted). */
export type OwnTaskList = TaskList & { id: string };

type Editing = { kind: 'new'; contextId: string } | { kind: 'rename'; list: OwnTaskList };

export const isOwnList = (l: TaskList | null | undefined): l is OwnTaskList => !!l && l.id !== null;

/** What the viewer may do with a context's lists: add some, and change or delete `list`. */
export type ListRights = { canAddLists: boolean; list?: TaskList | null };

export type TaskListActions = {
    /** New list… (where lists may be added), Rename… and Delete… (for `list`, as allowed). */
    entries: (contextId: string, rights: ListRights) => MenuEntry[];
    newList: (contextId: string) => void;
    rename: (list: OwnTaskList) => void;
    remove: (list: OwnTaskList) => Promise<void>;
    /** The name dialog: render it once where the actions are used. */
    dialog: ReactNode;
};

/**
 * `onCreated`: a list was made (the default shows it on the Tasks board). After a delete, a board
 * that showed the list shows its context.
 */
export function useTaskListActions(announce: (text: string) => void, onCreated?: (list: OwnTaskList) => void): TaskListActions {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const route = useRoute();
    const { history } = useNavigation();
    const [editing, setEditing] = useState<Editing | null>(null);

    const created =
        onCreated ??
        ((list: OwnTaskList) => history.push({ list: tasksPage({ context: list.context_id, list: list.id }), detail: null }));

    const remove = async (list: OwnTaskList) => {
        const n = list.task_count;
        // one task is said without its number; the counted forms are for the languages that have more of them
        const message = !n
            ? t("This can't be undone.")
            : n === 1
              ? t("Its task is deleted with it, with its comments and files. This can't be undone.")
              : tn(n, "Its {{count}} task is deleted with it, with its comments and files. This can't be undone.", "Its {{count}} tasks are deleted with it, with their comments and files. This can't be undone.");
        if (!(await confirmAction({ title: t('Delete the list “{{title}}”?', { title: list.title }), message, okLabel: t('Delete') }))) return;
        try {
            await deleteTaskList(api, queryClient, list);
            announce(t('Deleted the list “{{title}}”', { title: list.title }));
            const shown = route.list;
            if (shown.section === 'tasks' && shown.taskContext === list.context_id && shown.taskList === list.id)
                history.push({ list: tasksPage({ context: list.context_id, completed: shown.feed === 'completed' }), detail: null });
        } catch (e) {
            announce(t('Could not delete the list: {{reason}}', { reason: errorMessage(e) }));
        }
    };

    const entries = (contextId: string, { canAddLists, list }: ListRights): MenuEntry[] => {
        const own = isOwnList(list) ? list : null;
        const out: MenuEntry[] = [];
        if (canAddLists) out.push({ text: t('New list…'), run: () => setEditing({ kind: 'new', contextId }) });
        const listEntries: MenuEntry[] = [];
        if (own?.viewer?.can_edit) listEntries.push({ text: t('Rename “{{title}}”…', { title: own.title }), run: () => setEditing({ kind: 'rename', list: own }) });
        if (own?.viewer?.can_delete) listEntries.push({ text: t('Delete “{{title}}”…', { title: own.title }), run: () => void remove(own) });
        if (out.length && listEntries.length) out.push('separator');
        return [...out, ...listEntries];
    };

    return {
        entries,
        newList: (contextId) => setEditing({ kind: 'new', contextId }),
        rename: (list) => setEditing({ kind: 'rename', list }),
        remove,
        dialog: (
            <TaskListDialog
                editing={editing}
                onClose={() => setEditing(null)}
                onSaved={(saved, was) => {
                    setEditing(null);
                    if (was.kind === 'new') {
                        announce(t('List “{{title}}” added', { title: saved.title }));
                        if (isOwnList(saved)) created(saved);
                    } else announce(t('Renamed the list to “{{title}}”', { title: saved.title }));
                }}
            />
        ),
    };
}

/**
 * The name of a new list, or a list's new name, in a small modal dialog. Checked before it is
 * sent as the site's form checks it; what the site refuses is said in it. Esc or Cancel closes
 * it, and focus goes back to what opened it.
 */
function TaskListDialog({ editing, onClose, onSaved }: { editing: Editing | null; onClose: () => void; onSaved: (list: TaskList, was: Editing) => void }) {
    const titleId = useId();
    const open = editing !== null;

    return (
        <Dialog open={open} onClose={onClose} className="dialog task-list-dialog" labelledBy={titleId}>
            {editing ? <ListNameForm key={editing.kind === 'new' ? `new-${editing.contextId}` : editing.list.id} editing={editing} titleId={titleId} onClose={onClose} onSaved={onSaved} /> : null}
        </Dialog>
    );
}

function ListNameForm({ editing, titleId, onClose, onSaved }: { editing: Editing; titleId: string; onClose: () => void; onSaved: (list: TaskList, was: Editing) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState(editing.kind === 'rename' ? editing.list.title : '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
    const renaming = editing.kind === 'rename';

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (busy) return;
        const text = title.trim();
        const problem = titleProblem(text);
        if (problem) {
            // titleProblem's two refusals, said of a list's name
            setError(
                Array.from(text).length < TITLE_MIN
                    ? tn(TITLE_MIN, 'A list’s name needs at least {{count}} character', 'A list’s name needs at least {{count}} characters')
                    : tn(TITLE_MAX, 'A list’s name can have up to {{count}} character', 'A list’s name can have up to {{count}} characters'),
            );
            return;
        }
        if (renaming && text === editing.list.title) {
            onClose();
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const saved = renaming ? await renameTaskList(api, queryClient, editing.list, text) : await createTaskList(api, queryClient, editing.contextId, text);
            onSaved(saved, editing);
        } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
        }
    };

    return (
        <form className="budget-form" onSubmit={(e) => void submit(e)} onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), e.stopPropagation(), onClose())}>
            <div className="dialog-head">
                <h2 id={titleId}>{renaming ? t('Rename list') : t('New list')}</h2>
                <button type="button" className="btn btn-quiet icon-btn" aria-label={t('Close')} onClick={onClose}>
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div className="dialog-body">
                <label className="budget-field">
                    <span>{t('Name', { context: 'list' })}</span>
                    {/* the dialog opens to type the name */}
                    <input
                        type="text"
                        value={title}
                        maxLength={TITLE_MAX}
                        autoFocus
                        autoComplete="off"
                        dir="auto"
                        aria-describedby={error ? errorId : undefined}
                        aria-invalid={error ? true : undefined}
                        onFocus={(e) => renaming && e.currentTarget.select()}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </label>
                {error ? (
                    <p id={errorId} className="error" role="alert">
                        {error}
                    </p>
                ) : null}
                <div className="budget-form-actions">
                    <button type="button" className="btn" onClick={onClose}>
                        {t('Cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" aria-disabled={busy || !title.trim() || undefined} data-busy={busy || undefined} aria-busy={busy || undefined}>
                        <span>{renaming ? t('Save') : t('Add list')}</span>
                    </button>
                </div>
            </div>
        </form>
    );
}
