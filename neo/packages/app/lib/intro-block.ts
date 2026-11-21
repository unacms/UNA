/**
 * UNA's `intro` block: a picture, a title (the page's heading) and a line of text, as the Sign up page has beside its
 * form (`system:create_account_intro`, BxBaseServiceAccount::serviceCreateAccountIntro). UNA sends the picture as
 * shapes (BxDolIllustration::getAPI), because iOS and Android have no web view to show its SVG file: each shape is a
 * path and the name of its colour, which the apps draw in their own theme colours (`Illustration`).
 *
 * No app imports, so `node --test packages/app/lib/intro-block.test.ts` runs it from the NEO root.
 */
import type { IllustrationPicture, IllustrationShape, IllustrationTone } from '../ui/molecules/content/illustration.types';

/** UNA's tone names (a path's `data-tone` in the picture's template) and the app's. */
const TONES: Record<string, IllustrationTone> = {
    muted: 'muted',
    accent: 'accent',
    'accent-foreground': 'accentForeground',
    primary: 'primary',
    'primary-foreground': 'primaryForeground',
};

/** Path commands and numbers only: what goes into an SVG `d` as it is. */
const PATH = /^[MmZzLlHhVvCcSsQqTtAa0-9eE\s,.+-]+$/;
const VIEW_BOX = /^-?\d+(\.\d+)?( -?\d+(\.\d+)?){3}$/;

const SHAPES_MAX = 64;
const PATH_MAX = 2000;

export const PICTURE_VIEW_BOX = '0 0 200 200';

function shapeOf(value: unknown): IllustrationShape | null {
    if (!value || typeof value !== 'object') return null;
    const { d, tone, even_odd: evenOdd } = value as Record<string, unknown>;
    if (typeof d !== 'string' || !d.trim() || d.length > PATH_MAX || !PATH.test(d)) return null;
    const appTone = typeof tone === 'string' && Object.hasOwn(TONES, tone) ? TONES[tone] : undefined;
    if (!appTone) return null;
    return evenOdd === true ? { d: d.trim(), tone: appTone, evenOdd: true } : { d: d.trim(), tone: appTone };
}

/**
 * The picture UNA sends with a block (`picture`: `view_box` and `shapes`) as the app draws it, or null for none: an
 * older UNA, a picture without a shape the app knows. A shape with an unknown tone or anything but path data is left
 * out; the rest still make the picture.
 */
export function unaPicture(value: unknown): IllustrationPicture | null {
    if (!value || typeof value !== 'object') return null;
    const { view_box: viewBox, shapes } = value as Record<string, unknown>;
    if (!Array.isArray(shapes)) return null;

    const known = shapes
        .slice(0, SHAPES_MAX)
        .map(shapeOf)
        .filter((shape): shape is IllustrationShape => shape !== null);
    if (!known.length) return null;

    return {
        viewBox: typeof viewBox === 'string' && VIEW_BOX.test(viewBox.trim()) ? viewBox.trim() : PICTURE_VIEW_BOX,
        shapes: known,
    };
}

export type IntroOwn = {
    /** Translation keys a project may add (`customization/translation.js`) for its own words; core ships none. */
    titleKey: string;
    textKey: string;
    /** The static component (`customization/static.js`) a project may replace with its own picture. */
    picture: string;
};

/**
 * What a project built on NEO may have of its own for the intro UNA names `name`, from before UNA sent the block:
 * the Sign up page's words and picture. Its own win over UNA's (`landingText`, `ElementIntro`). Null for an intro
 * the apps never drew themselves.
 */
const OWN: Record<string, IntroOwn> = {
    create_account: { titleKey: 'create_account_page_title', textKey: 'create_account_page_text', picture: 'join_text' },
    create_account_invite: {
        titleKey: 'create_account_page_title_request_invite',
        textKey: 'create_account_page_text_request_invite',
        picture: 'join_text',
    },
};

export function introOwn(name: unknown): IntroOwn | null {
    return typeof name === 'string' && Object.hasOwn(OWN, name) ? (OWN[name] ?? null) : null;
}

/** A block content item is UNA's intro. */
export function isIntroItem(item: unknown): boolean {
    return Boolean(item) && typeof item === 'object' && (item as { type?: unknown }).type === 'intro';
}
