import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { postMenuEntries } from './post-menu';
import { emojiFromReactionCode, givenKind, ReactionGlyph, reactionLook } from './reaction-glyph';

afterEach(cleanup);

describe('reaction glyphs', () => {
    it('draws the icon in icon mode and the emoji in emoji mode, hidden from screen readers', () => {
        const kind = { emoji: '😂', icon: 'laugh' };
        const icon = render(<ReactionGlyph kind={kind} look="icon" />).container;
        expect(icon.querySelector('[data-icon="laugh"]')).toBeTruthy();
        expect(icon.textContent?.trim()).toBe('');
        expect(icon.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
        cleanup();
        const emoji = render(<ReactionGlyph kind={kind} look="emoji" />).container;
        expect(emoji.querySelector('[data-icon]')).toBeNull();
        expect(emoji.textContent).toBe('😂');
        expect(emoji.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    });

    it('falls back to the emoji for an icon the app does not bundle, and to the icon for no emoji', () => {
        expect(render(<ReactionGlyph kind={{ emoji: '🎉', icon: 'party-popper-unknown' }} look="icon" />).container.textContent).toBe('🎉');
        cleanup();
        expect(render(<ReactionGlyph kind={{ emoji: '🎉', icon: null }} look="icon" />).container.textContent).toBe('🎉');
        cleanup();
        expect(render(<ReactionGlyph kind={{ emoji: '', icon: 'heart' }} look="emoji" />).container.querySelector('[data-icon="heart"]')).toBeTruthy();
    });

    it('draws icons by default whatever the site\'s Icon / Emoji choice (as NEO\'s web client), or follows the site when set to', () => {
        expect(reactionLook('emoji')).toBe('icon');
        expect(reactionLook('icon')).toBe('icon');
        expect(reactionLook(undefined)).toBe('icon');
        expect(reactionLook('emoji', 'site')).toBe('emoji');
        expect(reactionLook('icon', 'site')).toBe('icon');
        // not known yet (the details are on their way): emoji, which every kind has
        expect(reactionLook(undefined, 'site')).toBe('emoji');
        expect(reactionLook('icon', 'emoji')).toBe('emoji');
    });

    it('reads a freely picked emoji\'s e_ code, and draws the viewer\'s reaction from the site\'s list or as that emoji', () => {
        expect(emojiFromReactionCode('e_1f98a')).toBe('🦊');
        expect(emojiFromReactionCode('e_2764_fe0f')).toBe('❤️');
        expect(emojiFromReactionCode('like')).toBeNull();
        expect(emojiFromReactionCode('e_d800')).toBeNull();
        expect(emojiFromReactionCode(null)).toBeNull();
        const list = [{ name: 'like', title: 'Like', emoji: '👍', icon: 'thumbs-up', color: null }];
        expect(givenKind(list, 'like')).toBe(list[0]);
        expect(givenKind(list, 'e_1f98a')).toEqual({ name: 'e_1f98a', title: '🦊 Reacted', emoji: '🦊', icon: null, color: null });
        expect(givenKind(list, 'gone')).toBeNull();
        expect(givenKind(list, null)).toBeNull();
        expect(render(<ReactionGlyph kind={givenKind(list, 'e_1f98a')!} look="icon" />).container.textContent).toBe('🦊');
    });
});

describe('the post menu\'s reactions', () => {
    const reactions = [
        { name: 'like', title: 'Like' },
        { name: 'love', title: 'Love' },
    ];

    it('lists each reaction in a section of its own under a greyed React heading, the viewer\'s checked, l beside the one it would do', () => {
        const run = vi.fn();
        const entries = postMenuEntries(['open', 'comment', 'react', 'separator', 'author'], { authorName: 'Lily', reacted: true, mac: true, reactions, reaction: 'love' }, run);
        expect(entries.map((e) => (e === 'separator' ? '-' : `${e.text}${e.checked ? ' ✓' : ''}${e.enabled === false ? ' (off)' : ''}`))).toEqual([
            'Open Post',
            'Comment',
            '-',
            'React (off)',
            'Like',
            'Love ✓',
            '-',
            'Open Author',
        ]);
        const key = (e: (typeof entries)[number] | undefined) => (e === 'separator' ? undefined : e?.keyshortcuts);
        // l takes back Love, so l is beside Love, not Like
        expect(key(entries[4])).toBeUndefined();
        expect(key(entries[5])).toBe('l');
        const love = entries[5];
        if (love !== 'separator') love?.run();
        expect(run).toHaveBeenCalledWith('react', 'love');
        // no reaction yet: l gives the default
        const none = postMenuEntries(['react'], { authorName: 'Lily', reacted: false, mac: true, reactions, reaction: null }, run);
        expect(none.map(key)).toEqual([undefined, 'l', undefined]);
    });

    it('keeps one React item for a site with one reaction, and no separator at either end', () => {
        const one = postMenuEntries(['react'], { authorName: 'Lily', reacted: false, mac: true, reactions: [reactions[0]!] }, () => {});
        expect(one.map((e) => (e === 'separator' ? '-' : e.text))).toEqual(['React']);
        const only = postMenuEntries(['react', 'separator', 'author'], { authorName: 'Lily', reacted: false, mac: true, reactions }, () => {});
        expect(only.map((e) => (e === 'separator' ? '-' : e.text))).toEqual(['React', 'Like', 'Love', '-', 'Open Author']);
    });
});
