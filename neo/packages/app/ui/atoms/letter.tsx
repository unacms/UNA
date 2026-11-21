import { View } from 'app/design/view'
import { cn, decodeText, getRandomColor } from 'app/lib/util'
import { Text } from 'app/design/typography'

type LetterProps = {
    title?: string;
    id?: string | number;
    /** UNA's colour for this profile (`color` / `author_data.color`), as the site draws its letter. */
    color?: string | null;
    className?: string;
    textClassName?: string;
};

export default function Letter({ title, id, color: unaColor, className, textClassName }: LetterProps) {
    // Decoded first, or `&amp; Co` would show `&`.
    const letter = title ? decodeText(title).substr(0, 1) : ''
    const color = id || title ? `${getRandomColor(id ? id : title)}-500` : 'muted'
    return (
        <View
            className={cn(
                'items-center justify-center uppercase',
                !unaColor && 'opacity-80',
                className || 'rounded-full h-16 w-16 md:h-24 md:w-24 xl:h-32 xl:w-32',
                !unaColor && `bg-${color}`,
            )}
            style={unaColor ? { backgroundColor: unaColor } : undefined}
        >
            <Text
                className={cn(
                    'font-bold text-white',
                    !unaColor && 'opacity-80',
                    textClassName || 'text-4xl xl:text-5xl',
                )}
            >
                {letter}
            </Text>
        </View>
    )
}
