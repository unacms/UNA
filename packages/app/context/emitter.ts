import { EventEmitter } from 'fbemitter';

/**
 * App-wide event bus (fbemitter).
 *
 *   import emitter, { EVENTS } from 'app/context/emitter';
 *   emitter.emit(EVENTS.editor, { action: 'blur' });
 *   const sub = emitter.addListener(EVENTS.form(name), (e) => { ... });
 *   return () => sub.remove();
 *
 * Every event name lives in EVENTS below — add new ones here, never as a bare
 * string at the call site. The string values are a contract with forks
 * (customization/) and must not change.
 */
const emitter = new EventEmitter();
export default emitter;

export const EVENTS = {
    // ************************ editor & forms ********************************

    editor: 'editor',
        /* Rich-text editor.
         *     focus — note?, timeout?
         *     blur — timeout?
         *     set_content — value
         *     insert_inline_image — form_name?, src, width?, height?
         */

    form: (name: string) => `form_${name}`,
        /* One form instance.
         *     submited — formInstanceId, awaitsResponse?
         *     received — formInstanceId?, data?
         *     pasted_images — images, inlinePaste?
         *     upload_start | upload_end — formInstanceId?, hash
         *     upload_clear — formInstanceId?
         */

    unsavedFormConfirm: 'unsaved_form_confirm_request',
        /* Ask before leaving a form with unsaved changes.
         *     message, anchor (topmost modal close button | null), settle(confirmed: boolean)
         */

    unsavedFormDiscard: 'unsaved_form_discard',
        /* The user chose to close without saving: these forms' edits are dropped.
         *     formInstanceIds: string[]
         */

    fieldFiles: (name: string) => `fld_files_${name}`,
        /* Files field of a form.
         *     add — source?, mediaTypes?
         *     clear
         */

    fieldLabels: (name: string) => `fld_labels_${name}`,
        /* add */

    fieldPolls: (name: string) => `fld_polls_${name}`,
        /* add */

    // ************************ navigation & page *****************************

    link: 'link',
        /* pressed — href?. Closes overlays and menus. */

    page: 'page',
        /* Current page.
         *     reload
         *     updated — data
         */

    conductor: 'conductor',
        /* Conductor (section) state.
         *     filters — values, merge?
         *     endpoint — request_url, unit?, module?, params? | { restore: true }
         *     reset_to_first
         */

    dynamicMenu: 'dynamic_menu',
        /* hide */

    wiki: 'wiki',
        /* reload */

    tabsMore: 'tabs-more',
        /* open | close — native "More" menu. Core no longer emits it (the tab's own
         * tabPress opens it); kept for forks still on the old native-tab-press-sync. */

    // ************************ content ***************************************

    feed: 'feed',
        /* Feed list.
         *     new_content — data
         *     remove_content — id
         */

    commentThread: (module: string, objectId: string | number) => `comment_${module}_${objectId}`,
        /* Comments of one object. Payload always includes data.
         *     new_content
         *     remove_content
         *     reply_comment
         */

    comment: 'comment',
        /* send */

    connections: 'connections',
        /* changed — reload?, object? */

    notifications: 'notifications',
        /* arrived */

    // ************************ tasks *****************************************

    tasksList: 'tasks_list',
        /* Tasks list.
         *     reload
         *     patch — id, field, value
         *     open — url, title?
         *     close
         */

    tasksBrowserLocation: 'tasks_browser_location',
        /* method, url, state */

    taskTimer: 'task_timer',
        /* id, action: log | clear | <menu item name> */

    taskTimerSync: 'task_timer_sync',
        /* timer snapshot */

    // ************************ agents ****************************************

    operatorAgent: 'operator_agent',
        /* Operator agent float ↔ host.
         *     toggle_history
         *     start_new
         *     state — history, restart
         */
} as const;
