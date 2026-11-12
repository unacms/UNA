import type { ReactNode } from 'react';

import { Icon, type IconName } from './icon';

type Props = {
    /** Drawn now; otherwise only its (empty) live region stays in the page. */
    shown?: boolean;
    /** The disc's icon; none for a quiet note without a disc. */
    icon?: IconName;
    title: string;
    hint?: ReactNode;
    /** One primary action, at most one secondary (spec 4.6). */
    actions?: ReactNode;
};

/**
 * What a list or pane says when it has nothing (spec 4.6): an icon on a disc, a title, a hint
 * and the way out. The words are in a role="status" element that stays mounted while the list
 * has items too (the stable region pattern, section 13), so a list that turns empty is
 * announced; the disc and the buttons are outside it, so they are not read as part of it.
 */
export function EmptyState({ shown = true, icon, title, hint, actions }: Props) {
    return (
        <div className={shown ? 'empty-state' : 'empty-state-idle'}>
            {shown && icon ? (
                <span className="empty-disc" aria-hidden="true">
                    <Icon name={icon} size={28} />
                </span>
            ) : null}
            <div role="status" className={shown ? 'empty-words' : 'sr-only'}>
                {shown ? (
                    <>
                        <p className="empty-title">{title}</p>
                        {hint ? <p className="empty-hint">{hint}</p> : null}
                    </>
                ) : null}
            </div>
            {shown && actions ? <div className="empty-actions">{actions}</div> : null}
        </div>
    );
}
