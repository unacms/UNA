import { isWeb } from 'app/lib/util';

/**
 * Fade behind chrome floating over an agent chat transcript (a header over the top,
 * the composer over the bottom), as in the messenger: from the colour of the surface
 * the chat sits on to transparent, so messages scrolling under it dissolve into that
 * surface. On iOS `EdgeBlurView` draws a native progressive blur instead.
 *
 * Surfaces:
 * - `card`: a page block's card, `bg-card/60` over the page (theme `u-block-bg`).
 * - `panel`: a floating panel, opaque `bg-popover` (the operator agent dropdown and
 *   tab-bar card).
 * - `background`: the page itself (the full-page agents view, a block without background).
 *
 * On web the translucent card fades from the same mix of card over page, so the
 * fade's solid end matches what it sits on instead of reading as a lighter band.
 * `bottomTall` is for a composer with task hints above it, and `solid` goes right behind
 * the hints: the fade is a share of the composer's height, so on a tall composer (hints
 * on several rows, a long draft) it would reach them and messages would show through.
 * Class names are spelled out in full so Tailwind can find them.
 */
const NATIVE_CARD = {
    top: 'bg-linear-to-b from-card from-40% to-transparent',
    bottom: 'bg-linear-to-t from-card from-40% to-transparent',
    bottomTall: 'bg-linear-to-t from-card from-85% to-transparent',
    solid: 'bg-card',
};

const EDGE_WASH = {
    card: isWeb
        ? {
              top: 'bg-linear-to-b from-[color-mix(in_oklab,var(--color-card)_60%,var(--color-background))] from-40% to-transparent',
              bottom: 'bg-linear-to-t from-[color-mix(in_oklab,var(--color-card)_60%,var(--color-background))] from-40% to-transparent',
              bottomTall: 'bg-linear-to-t from-[color-mix(in_oklab,var(--color-card)_60%,var(--color-background))] from-85% to-transparent',
              solid: 'bg-[color-mix(in_oklab,var(--color-card)_60%,var(--color-background))]',
          }
        : NATIVE_CARD,
    panel: {
        top: 'bg-linear-to-b from-popover from-40% to-transparent',
        bottom: 'bg-linear-to-t from-popover from-40% to-transparent',
        bottomTall: 'bg-linear-to-t from-popover from-85% to-transparent',
        solid: 'bg-popover',
    },
    background: {
        top: 'bg-linear-to-b from-background from-40% to-transparent',
        bottom: 'bg-linear-to-t from-background from-40% to-transparent',
        bottomTall: 'bg-linear-to-t from-background from-85% to-transparent',
        solid: 'bg-background',
    },
};

/**
 * @param {'card'|'panel'|'background'} surface
 * @returns {{ top: string, bottom: string, bottomTall: string, solid: string }} Wash classes for each edge.
 */
export function edgeWash(surface) {
    return EDGE_WASH[surface] || EDGE_WASH.card;
}
