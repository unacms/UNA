import { Text } from 'app/design/typography'

export default function ProfileDisplayNameLink({title, url, href, fontSize, actions, options}) {
    const inheritTextSize = options?.inheritTextSize === true;
    const extraTextClass = options?.textClassName || '';

    // Always apply text-foreground - on native, Text doesn't inherit color from View/Pressable parents
    // The inheritColor option is removed as it only worked on web via CSS cascade
    const baseColorClass = 'text-foreground web:hover:text-primary';
    const sizeClass = inheritTextSize ? '' : (fontSize || 'text-sm');
    const composed = `${baseColorClass} ${sizeClass} ${extraTextClass} truncate text-ellipsis font-semibold tracking-tight`.trim();

    return (
        <Text className={composed}>
            {title}
        </Text>
    )
}