import { View } from 'app/design/view'
import { cn, getRandomColor } from 'app/lib/util'
import { Text } from 'app/design/typography'

type LetterProps = {
    title?: string;
    id?: string | number;
    className?: string;
    textClassName?: string;
};

export default function Letter({ title, id, className, textClassName }: LetterProps) {
    const letter = title ? title.substr(0, 1) : ''
    const color = id || title ? `${getRandomColor(id ? id : title)}-500` : 'muted'
    return (
        <View
            className={cn(
                'items-center justify-center uppercase opacity-80',
                className || 'rounded-full h-16 w-16 md:h-24 md:w-24 xl:h-32 xl:w-32',
                `bg-${color}`,
            )}
        >
            <Text
                className={cn(
                    'font-bold opacity-80 text-white',
                    textClassName || 'text-4xl xl:text-5xl',
                )}
            >
                {letter}
            </Text>
        </View>
    )
}
