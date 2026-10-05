// Wraps react-native-enriched-html's useMentionEvents.
// The stock hook always calls editor.on() with no null check. TipTap on Next
// returns null until useEffect, which crashes a clean production bundle.
import { useMentionEvents as realUseMentionEvents } from '@enriched-use-mention-events-real';

const NOOP_EDITOR = {
    isDestroyed: true,
    on() {},
    off() {},
};

export function useMentionEvents(editor, getCallbacks) {
    return realUseMentionEvents(
        editor && !editor.isDestroyed ? editor : NOOP_EDITOR,
        getCallbacks
    );
}
