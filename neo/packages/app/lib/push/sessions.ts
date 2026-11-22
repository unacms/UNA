/**
 * Keeps linking a device with a member in step with the end of that member's session: a link
 * asked for in one session never runs in the next, and an unlink waits for a link that is still
 * on its way, so it is the last word. Pure: `node --test packages/app/lib/push/sessions.test.ts`.
 */
export function createPushSessions() {
    let session = 0;
    let queue: Promise<unknown> = Promise.resolve();

    const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
        const run = queue.then(work);
        // One failed step must not stop the ones after it.
        queue = run.catch(() => undefined);
        return run;
    };

    return {
        /** The session now. Take it when the work starts (the effect, the press) and pass it to `link`. */
        current: (): number => session,
        /** Runs `work` if `from` is still the session; resolves `false`, without running it, once that session ended. */
        link: (from: number, work: () => Promise<void>): Promise<boolean> =>
            enqueue(async () => {
                if (from !== session) return false;
                await work();
                return true;
            }),
        /** Ends the session at once; `work` (the unlink) runs after any link already started. */
        end: (work: () => Promise<void>): Promise<void> => {
            session += 1;
            return enqueue(work);
        },
    };
}
