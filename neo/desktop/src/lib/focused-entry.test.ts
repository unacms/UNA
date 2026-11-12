import { afterEach, describe, expect, it, vi } from 'vitest';

import { canCommentOn, focusWhenPresent, openFocusedAuthor, REACTION_SETTLED, replyToFocusedComment, toggleFocusedReaction } from './focused-entry';

afterEach(() => {
    document.body.innerHTML = '';
});

function post(): { article: HTMLElement; react: HTMLButtonElement; author: HTMLButtonElement } {
    document.body.innerHTML = `
        <article class="card activity" tabindex="0">
            <button data-profile-link="8">Mila</button>
            <button data-react-toggle aria-pressed="false">Like</button>
        </article>
        <article class="comment" id="comment-5">
            <button data-profile-link="10">Tom</button>
            <button id="comment-5-edit">Edit</button>
        </article>
        <button id="comment-5-reply">Reply</button>
        <button id="outside">Outside</button>`;
    return {
        article: document.querySelector('article.activity')!,
        react: document.querySelector('[data-react-toggle]')!,
        author: document.querySelector('[data-profile-link="8"]')!,
    };
}

describe('keys on what has focus', () => {
    it('l presses the focused post’s reaction toggle and says what it came to once the site answered', async () => {
        const { article, react } = post();
        const click = vi.fn();
        react.addEventListener('click', click);
        article.focus();
        const settled = toggleFocusedReaction();
        expect(click).toHaveBeenCalledOnce();
        react.dispatchEvent(new CustomEvent(REACTION_SETTLED, { detail: { reacted: true } }));
        await expect(settled).resolves.toEqual({ reacted: true });

        // a toggle still busy with the last press would ignore this one: nothing to say
        react.setAttribute('data-busy', 'true');
        expect(toggleFocusedReaction()).toBeNull();
        expect(click).toHaveBeenCalledOnce();
        react.removeAttribute('data-busy');

        document.getElementById('outside')!.focus();
        expect(toggleFocusedReaction()).toBeNull();
    });

    it('a post says whether it takes comments', () => {
        const { article } = post();
        expect(canCommentOn(article)).toBe(false);
        article.dataset.canComment = 'true';
        expect(canCommentOn(article)).toBe(true);
    });

    it('focuses the fallback when the element never comes and focus stayed', () => {
        vi.useFakeTimers();
        try {
            post();
            const heading = document.createElement('h2');
            heading.id = 'detail-title';
            heading.tabIndex = -1;
            document.body.append(heading);
            document.getElementById('outside')!.focus();
            focusWhenPresent('never', 3000, 'detail-title');
            vi.advanceTimersByTime(3000);
            expect(document.activeElement).toBe(heading);

            document.getElementById('outside')!.focus();
            focusWhenPresent('never', 3000, 'detail-title');
            document.getElementById('comment-5-edit')!.focus();
            vi.advanceTimersByTime(3000);
            expect(document.activeElement?.id).toBe('comment-5-edit');
        } finally {
            vi.useRealTimers();
        }
    });

    it('p opens the author of the focused post, or of the focused comment', () => {
        const { article, author } = post();
        const opened: string[] = [];
        document.querySelectorAll<HTMLElement>('[data-profile-link]').forEach((b) => b.addEventListener('click', () => opened.push(b.dataset.profileLink!)));
        article.focus();
        expect(openFocusedAuthor()).toBe(true);
        document.getElementById('comment-5-edit')!.focus();
        expect(openFocusedAuthor()).toBe(true);
        expect(opened).toEqual(['8', '10']);
        document.getElementById('outside')!.focus();
        expect(openFocusedAuthor()).toBe(false);
        expect(author).toBeTruthy();
    });

    it('r presses the focused comment’s Reply button', () => {
        post();
        const click = vi.fn();
        document.getElementById('comment-5-reply')!.addEventListener('click', click);
        document.getElementById('comment-5-edit')!.focus();
        expect(replyToFocusedComment()).toBe(true);
        expect(click).toHaveBeenCalledOnce();
        document.querySelector<HTMLElement>('article.activity')!.focus();
        expect(replyToFocusedComment()).toBe(false);
    });

    it('focuses an element once it is in the document, unless focus moved meanwhile', async () => {
        post();
        document.getElementById('outside')!.focus();
        focusWhenPresent('late');
        const late = document.createElement('textarea');
        late.id = 'late';
        document.body.append(late);
        await new Promise((r) => setTimeout(r, 0));
        expect(document.activeElement).toBe(late);

        focusWhenPresent('later');
        document.getElementById('comment-5-edit')!.focus();
        const later = document.createElement('textarea');
        later.id = 'later';
        document.body.append(later);
        await new Promise((r) => setTimeout(r, 0));
        expect(document.activeElement?.id).toBe('comment-5-edit');
    });
});
