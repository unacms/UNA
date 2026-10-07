import { Pressable } from 'app/design/view';
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native';
import { useOpenModalByUrl } from 'app/context/jotai/modal';

export default function LinkModal({
    href,
    children,
    showInModal = false,
    className = '',
    onPress,
    onClick,
    onPressIn,
    onPointerDown,
    ...rest
}) {
    const openModalByUrl = useOpenModalByUrl();
    if (!href){
        return children;
    }
    if (!showInModal) {
        return (
            <Link
                href={href}
                className={className}
                onPress={onPress}
                onClick={onClick}
                {...(onPressIn ? { onPressIn } : null)}
                {...(onPointerDown ? { onPointerDown } : null)}
                {...rest}
            >
                {children}
            </Link>
        );
    }

    return (
        <Pressable
            href={href}
            className={className}
            onPressIn={onPressIn}
            onPointerDown={onPointerDown}
            onPress={(e) => {
                onPress?.(e);
                if (Platform.OS === "web") e.preventDefault();
                openModalByUrl(href);
            }}
            {...rest}
        >
            {children}
        </Pressable>
    );
}