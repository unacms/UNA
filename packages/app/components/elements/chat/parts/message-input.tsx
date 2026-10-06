import type { ReactNode } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { View, Row } from 'app/design/view';
import { useIsDesktop } from 'app/context/measure';
import { hasLiquidGlass } from 'app/lib/util';
import { GlassSurface } from 'app/ui/atoms/glass-surface';

const isWeb = Platform.OS === 'web';

type MessageInputProps = {
    /** Text or attachments present. */
    expanded: boolean;
    avatar?: ReactNode;
    /** Right-hand buttons. */
    actions?: ReactNode;
    /** Rendered inside the surface, before the input (hidden form fields). */
    header?: ReactNode;
    /** Rendered inside the surface, after it (attachment previews). */
    footer?: ReactNode;
    /** The input. */
    children: ReactNode;
};

/**
 * The message composer's surface, shared by the messenger form and the agent
 * chat: a translucent pill (Liquid Glass on iOS 26) with the avatar bottom-left
 * and the actions bottom-right. Empty, it is one rounded-full line and the
 * input leaves room for the avatar (if any); once it has content it becomes rounded-2xl
 * and the actions drop under the text.
 */
export function MessageInput({ expanded, avatar, actions, header, footer, children }: MessageInputProps) {
    const isDesktop = useIsDesktop();
    const growFromBottom = !isDesktop;
    const rounded = expanded ? 'rounded-2xl' : 'rounded-full';
    // iOS 26: Liquid Glass that grows with the editor; elsewhere a translucent card.
    const surface = hasLiquidGlass ? '' : 'bg-card/90 backdrop-blur-lg shadow-btn-glass dark:shadow-btn-glass-deep';

    return (
        <View className={`w-full flex-auto ${surface} ${rounded}`}>
            {hasLiquidGlass ? <GlassSurface rounded={rounded} /> : null}
            {header}
            <Row className={`w-full gap-1 flex-auto ${growFromBottom ? 'items-end' : 'items-start'} `}>
                <View className="flex-auto ">
                    <View className=" items-stretch ">
                        <View
                            className={`p-2.5 min-h-12 flex-auto items-center justify-center ${expanded ? 'mb-10' : avatar ? 'ms-10' : ''}`}
                            style={isWeb
                                ? ({ transition: 'height 0.1s cubic-bezier(0.25, 0.1, 0.25, 1), padding-bottom 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' } as unknown as ViewStyle /* web-only `transition` */)
                                : undefined}
                        >
                            {children}
                        </View>
                        {avatar ? (
                            <View className="absolute flex  left-2 bottom-2 items-center justify-center">
                                {avatar}
                            </View>
                        ) : null}
                        <View className="flex-row absolute bottom-2 right-2 ">
                            <Row className={'items-center justify-center gap-2'}>
                                {actions}
                            </Row>
                        </View>
                    </View>
                </View>
            </Row>
            {footer}
        </View>
    );
}
