import { t, tCommand } from '../lib/i18n';
import { rich } from '../lib/i18n-rich';
import { COMMANDS, networkNumber, isSingleKeyCommand, keyCaps, tabNumber } from '../lib/shortcuts';

/** The keys of an open task (focus in it): its properties' menus, its due date, the next and previous task. */
const TASK_KEYS: readonly (readonly [string, string])[] = [
    ['S', t('In a task: change its state')],
    ['P', t('In a task: change its priority')],
    ['A', t('In a task: assign it')],
    ['L', t('In a task: change its labels')],
    ['E', t('In a task: change its estimate')],
    ['T', t('In a task: change its type')],
    ['D', t('In a task: set its due date')],
    ['J', t('In a task: the next task of the list')],
    ['K', t('In a task: the previous task of the list')],
];

function Keys({ caps }: { caps: string[] }) {
    return (
        <>
            {caps.map((k, i) => (
                <kbd key={i}>{k}</kbd>
            ))}
        </>
    );
}

/**
 * Every shortcut with its keys (the shortcut sheet, Settings > Keyboard). The nine network
 * keys are one row, and so are the nine tab keys. With single keys off, theirs say so.
 */
export function ShortcutList({ mac, singleKeys = true, labelledBy }: { mac: boolean; singleKeys?: boolean; labelledBy?: string }) {
    const shown = COMMANDS.filter((c) => keyCaps(c, mac).length > 0 && (networkNumber(c.id) ?? 1) === 1 && (tabNumber(c.id) ?? 1) === 1);
    const mod = mac ? '⌘' : 'Ctrl';
    return (
        <table className="shortcut-table" aria-labelledby={labelledBy}>
            <tbody>
                {shown.map((c) => {
                    const network = networkNumber(c.id) === 1;
                    const tab = tabNumber(c.id) === 1;
                    const caps = keyCaps(c, mac);
                    const off = !singleKeys && isSingleKeyCommand(c);
                    return (
                        <tr key={c.id} className={off ? 'off' : undefined}>
                            <th scope="row">{network ? t('Switch to network 1 to 9') : tab ? t('Show tab 1 to 8, or the last one with 9') : tCommand(c.help)}</th>
                            <td>
                                <Keys caps={network || tab ? [...caps.slice(0, -1), '1…9'] : caps} />
                                {off ? <span className="small muted"> {t('(off)')}</span> : null}
                            </td>
                        </tr>
                    );
                })}
                <tr>
                    <th scope="row">{t('Send what you wrote')}</th>
                    <td>
                        <Keys caps={[mod, 'Enter']} />
                    </td>
                </tr>
                {/* a task's detail (features/tasks/task-props.tsx useTaskKeys): single keys while focus is in it */}
                {TASK_KEYS.map(([k, help]) => (
                    <tr key={`task-${k}`} className={!singleKeys ? 'off' : undefined}>
                        <th scope="row">{help}</th>
                        <td>
                            <Keys caps={[k]} />
                            {!singleKeys ? <span className="small muted"> {t('(off)')}</span> : null}
                        </td>
                    </tr>
                ))}
                <tr>
                    <th scope="row">{t('Open in a new tab (with Option, a new window)')}</th>
                    <td>
                        {rich(t('<click></click> or <enter></enter>'), { click: () => <Keys caps={[mod, t('click')]} />, enter: () => <Keys caps={[mod, 'Enter']} /> })}
                    </td>
                </tr>
                <tr>
                    <th scope="row">{t('In the tabs: move the focused tab, close it')}</th>
                    <td>
                        <Keys caps={mac ? ['⌥', '⇧', '←'] : ['Alt', 'Shift', '←']} /> <Keys caps={mac ? ['⌥', '⇧', '→'] : ['Alt', 'Shift', '→']} />, <Keys caps={['Delete']} />
                    </td>
                </tr>
                <tr>
                    <th scope="row">{t('Back and forward')}</th>
                    <td>{t('The mouse’s back and forward buttons')}</td>
                </tr>
            </tbody>
        </table>
    );
}
