import { createContext, type ReactNode, useContext } from 'react';
import { createPortal } from 'react-dom';

import { type MenuEntry, showMenu, useMenuExpanded } from '../lib/native-menu';
import { Icon, type IconName } from './icon';
import { Tooltip } from './tooltip';

/**
 * One of a page's own commands (Join, Follow, New post, Edit profile ...): drawn in its hero
 * and, once the hero's buttons have scrolled under the toolbar, in the toolbar too. Both copies
 * are drawn from the same list, so they say the same and are busy at the same time.
 */
export type ContextAction = {
    key: string;
    /** What the button says. */
    label: string;
    /** Its name when that says more than the label ("Follow Lily Carter"); it starts with the label (WCAG 2.5.3). */
    name?: string;
    /** Its icon when the toolbar has room for icons only. */
    icon: IconName;
    /** The icon beside the label too (Message, New post, Edit profile). */
    iconWithLabel?: boolean;
    /** The view's one filled button. */
    primary?: boolean;
    /** Its request is running: a spinner in its place. */
    busy?: boolean;
    /** One of its set is running: it ignores presses (aria-disabled, so it keeps focus). */
    blocked?: boolean;
    /** A count after the label (Friend requests): shown as a badge, said as `spoken`. */
    count?: { text: string; spoken: string };
} & (
    | { run: () => void; menu?: undefined }
    | {
          run?: undefined;
          /**
           * A menu button (More) instead of a command: an icon button that opens the app's menu
           * (lib/native-menu) of `entries`, read when it opens. `owner` says it is open (aria-expanded);
           * `title` names the menu for screen readers.
           */
          menu: { owner: string; title: string; entries: () => MenuEntry[] };
      }
);

/** 'hero': the hero's buttons; 'toolbar': small ones with labels; 'icons': toolbar buttons with an icon and a tooltip. */
export type ActionsLook = 'hero' | 'toolbar' | 'icons';

/**
 * Whether the toolbar shows the page's actions now (shell/pane.tsx provides it): while it does,
 * the hero's copy is inert, so only one copy is a keyboard stop and in the accessibility tree.
 */
export const HeroActionsDockedContext = createContext(false);

/**
 * Where a hero's errors go while the toolbar shows its actions (shell/pane.tsx: a strip under the
 * toolbar): an action pressed there that fails says so where it was pressed, not under the hero,
 * which is scrolled out of view.
 */
export const HeroErrorSlotContext = createContext<HTMLElement | null>(null);

export function ContextActionButtons({ actions, look }: { actions: readonly ContextAction[]; look: ActionsLook }) {
    return (
        <>
            {actions.map((a) => (
                <ActionButton key={a.key} action={a} look={look} />
            ))}
        </>
    );
}

/**
 * A menu action (More): an icon button in every look, the hero's 36px square one or the toolbar's,
 * with a tooltip. A click or ArrowDown opens its menu under it.
 */
function MenuActionButton({ action: a, menu, look }: { action: ContextAction; menu: NonNullable<ContextAction['menu']>; look: ActionsLook }) {
    const open = useMenuExpanded(menu.owner);
    const show = (anchor: HTMLElement) => void showMenu(menu.entries(), { anchor }, { label: menu.title, owner: menu.owner });
    return (
        <Tooltip text={a.label}>
            <button
                type="button"
                className={look === 'hero' ? 'btn btn-menu' : 'tb-btn tb-btn-action'}
                aria-label={a.name ?? a.label}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(e) => show(e.currentTarget)}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        show(e.currentTarget);
                    }
                }}
            >
                <Icon name={a.icon} />
            </button>
        </Tooltip>
    );
}

function ActionButton({ action: a, look }: { action: ContextAction; look: ActionsLook }) {
    if (a.menu) return <MenuActionButton action={a} menu={a.menu} look={look} />;
    const run = a.run;
    const common = {
        type: 'button' as const,
        'aria-disabled': a.busy || a.blocked || undefined,
        'aria-busy': a.busy || undefined,
        'data-busy': a.busy || undefined,
        onClick: () => {
            if (!a.busy && !a.blocked) run();
        },
    };
    if (look === 'icons') {
        const tip = a.count ? `${a.label} (${a.count.text})` : a.label;
        return (
            <Tooltip text={tip}>
                <button
                    {...common}
                    className={`tb-btn tb-btn-action${a.primary ? ' tb-btn-primary' : ''}${a.count ? ' tb-btn-count' : ''}`}
                    aria-label={`${a.name ?? a.label}${a.count ? `, ${a.count.spoken}` : ''}`}
                >
                    <Icon name={a.icon} />
                    {a.count ? <span aria-hidden="true">{a.count.text}</span> : null}
                </button>
            </Tooltip>
        );
    }
    return (
        <button {...common} className={`btn${a.primary ? ' btn-primary' : ''}${look === 'toolbar' ? ' small' : ''}`} aria-label={a.name}>
            {a.iconWithLabel ? <Icon name={a.icon} /> : null}
            {/* a span, so the busy spinner hides it with the icon */}
            <span>{a.label}</span>
            {a.count ? (
                <>
                    <span className="nav-badge" aria-hidden="true">
                        {a.count.text}
                    </span>
                    <span className="sr-only">{`, ${a.count.spoken}`}</span>
                </>
            ) : null}
        </button>
    );
}

/**
 * A hero's actions, with what went wrong under them. The buttons are inert while the toolbar
 * shows its copy (they stay in place, so the hero keeps its size); the errors stay announced.
 */
export function HeroActions({ actions, errors }: { actions: readonly ContextAction[]; errors?: ReactNode }) {
    const docked = useContext(HeroActionsDockedContext);
    const slot = useContext(HeroErrorSlotContext);
    if (!actions.length && !errors) return null;
    const shownErrors = errors && docked && slot ? createPortal(errors, slot) : errors;
    return (
        <div className="hero-actions-box">
            {actions.length ? (
                <div className="profile-actions hero-actions" data-actions inert={docked || undefined}>
                    <ContextActionButtons actions={actions} look="hero" />
                </div>
            ) : null}
            {shownErrors}
        </div>
    );
}
