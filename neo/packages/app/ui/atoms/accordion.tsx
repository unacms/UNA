import { useCallback, type ReactNode, type Ref } from 'react';
import { type GestureResponderEvent, type TextProps, type ViewProps } from 'react-native';
import { View } from 'app/design/view';
import * as AccordionPrimitive from 'app/ui/primitives/accordion';
import { cn } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';
import { Text } from 'app/design/typography';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { cueAttributes, playPressCue } from 'app/lib/sound';

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
    /** When false, skips `FeedbackHaptics` and the open / close sound. */
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
    const { isExpanded } = AccordionPrimitive.useIsExpanded();
    // Expanding and collapsing are frequent: subtle open / close.
    const cue = isExpanded ? 'close' : 'open';
    const handlePress = useCallback(
        (event: GestureResponderEvent) => {
            onPress?.(event);
            if (!feedback) return;
            playPressCue({ cue, emphasis: 'subtle' });
            FeedbackHaptics('Nudge');
        },
        [feedback, onPress, cue]
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
                {...(feedback ? cueAttributes({ cue, emphasis: 'subtle' }) : {})}
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
