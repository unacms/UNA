import { useCallback, type ReactNode, type Ref } from 'react';
import { Platform, type GestureResponderEvent, type TextProps, type ViewProps } from 'react-native';
import { View } from 'app/design/view';
import * as AccordionPrimitive from 'app/ui/primitives/accordion';
import { cn } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';
import { Text } from 'app/design/typography';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { useSound } from 'app/lib/hooks/use-sound';

const accordionTheme = appSetting('theme', 'accordion') ?? {};

type AccordionProps = ViewProps & {
    className?: string;
    type?: 'single' | 'multiple';
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: (value: string | string[] | undefined) => void;
    collapsible?: boolean;
    ref?: Ref<any>;
};

export function Accordion({ className, ...props }: AccordionProps) {
    return (
        <AccordionPrimitive.Root
            className={cn(accordionTheme.root, className)}
            {...props}
        />
    );
}

type AccordionItemProps = ViewProps & {
    value: string;
    disabled?: boolean;
    className?: string;
    ref?: Ref<any>;
};

export function AccordionItem({ className, ...props }: AccordionItemProps) {
    return (
        <AccordionPrimitive.Item
            className={cn(accordionTheme.item, className)}
            {...props}
        />
    );
}

type AccordionTriggerTitleProps = TextProps & {
    className?: string;
    ref?: Ref<any>;
};

/**
 * Title row label — uses theme `accordion.trigger_text`. Pass `className` to override or extend.
 */
export function AccordionTriggerTitle({ className, children, ...props }: AccordionTriggerTitleProps) {
    return (
        <Text
            className={cn(accordionTheme.trigger_text, className)}
            {...props}
        >
            {children}
        </Text>
    );
}

type AccordionTriggerProps = {
    className?: string;
    titleClassName?: string;
    /** Rendered with `AccordionTriggerTitle`; otherwise `children` is the label. */
    title?: ReactNode;
    children?: ReactNode;
    chevronClassName?: string;
    onPress?: (event: GestureResponderEvent) => void;
    /** When false, skips `FeedbackHaptics` + native click sound (web still uses web-haptics only if you call it — here we skip all feedback). */
    feedback?: boolean;
    ref?: Ref<any>;
    [key: string]: unknown;
};

export function AccordionTrigger({
    className,
    titleClassName,
    title,
    children,
    chevronClassName,
    onPress,
    feedback = true,
    ...props
}: AccordionTriggerProps) {
    const isWeb = Platform.OS === 'web';
    const playClick = useSound('click');
    /** Native: `click` asset when `layout.sounds`. Web: [web-haptics](https://github.com/lochie/web-haptics) `nudge` + synth when `layout.sounds` + `layout.web_haptics_sounds` (see `feedback-haptics.web.ts`); skip `useSound` on web to avoid doubling. */
    const handlePress = useCallback(
        (event: GestureResponderEvent) => {
            onPress?.(event);
            if (!feedback) return;
            if (!isWeb) {
                playClick();
            }
            FeedbackHaptics('Nudge');
        },
        [feedback, isWeb, onPress, playClick]
    );

    const label =
        title !== undefined && title !== null ? (
            <AccordionTriggerTitle className={titleClassName}>
                {title}
            </AccordionTriggerTitle>
        ) : (
            children
        );

    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                className={cn(accordionTheme.trigger, className)}
                {...props}
                onPress={handlePress}
            >
                {({ isExpanded }: { isExpanded: boolean }) => (
                    <>
                        <View className="flex-1">
                            {label}
                        </View>
                        <View className="ml-2 shrink-0">
                            <View
                                className={
                                    accordionTheme.chevron_container ??
                                    'transition-transform duration-200'
                                }
                                style={{
                                    transform: [
                                        {
                                            rotate: isExpanded
                                                ? '180deg'
                                                : '0deg',
                                        },
                                    ],
                                }}
                            >
                                <Icon
                                    icon="ChevronDown"
                                    size={18}
                                    className={cn(
                                        accordionTheme.chevron,
                                        chevronClassName
                                    )}
                                />
                            </View>
                        </View>
                    </>
                )}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

type AccordionContentProps = ViewProps & {
    className?: string;
    innerClassName?: string;
    ref?: Ref<any>;
};

export function AccordionContent({ className, innerClassName, children, ...props }: AccordionContentProps) {
    return (
        <AccordionPrimitive.Content
            className={cn(accordionTheme.content, className)}
            {...props}
        >
            <View className={cn(accordionTheme.content_inner, innerClassName)}>
                {children}
            </View>
        </AccordionPrimitive.Content>
    );
}
