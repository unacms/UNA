import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { initialCountState, nextCountState, settleCountState, splitCount } from 'app/lib/count-change';

const isWeb = Platform.OS === 'web';

/** How long a change shows; the web keyframes in `global.web.css` (`.neo-count-flash`) last as long. */
const CHANGE_MS = 900;

type CountTextProps = {
    /** The count as it reads: "3 followers". */
    text: string;
    /** Its number. A new one for the same owner is shown as a change. */
    value?: number | string | null;
    /** Whose count it is (a profile id): a list row that now shows someone else has not changed its count. */
    owner?: number | string | null;
};

/**
 * A count inside a line of text that shows when its number changes (a card's followers after a follow): the text
 * takes the accent colour for a moment and, on web, the number rolls to the new one, up for more and down for fewer.
 * Put it inside a `Text`, which gives it its type and colour. The rules are in `lib/count-change.ts`.
 *
 * Native has no transforms inside a line of text, so there the colour alone marks the change. People who ask for
 * reduced motion get the colour without the roll.
 */
export default function CountText({ text, value, owner }: CountTextProps) {
    const [state, setState] = useState(() => initialCountState(text, value, owner));
    // Adjusting state while rendering: the change starts in the same commit as the new number.
    const shown = nextCountState(state, text, value, owner);
    if (shown !== state) setState(shown);

    const change = shown.change;
    const tick = change?.tick;
    useEffect(() => {
        if (tick === undefined) return undefined;
        const timer = setTimeout(() => setState((current) => settleCountState(current, tick)), CHANGE_MS);
        return () => clearTimeout(timer);
    }, [tick]);

    if (!change) return <Text>{text}</Text>;
    if (!isWeb) return <Text className="text-accent-foreground">{text}</Text>;

    const { before, number, after } = splitCount(text);
    const up = change.direction === 'up';
    return (
        <Text key={change.tick} className="neo-count-flash">
            {before}
            <span className="neo-count-num">
                <span aria-hidden="true" className={up ? 'neo-count-out-up' : 'neo-count-out-down'}>{change.from}</span>
                <span className={up ? 'neo-count-in-up' : 'neo-count-in-down'}>{number}</span>
            </span>
            {after}
        </Text>
    );
}
