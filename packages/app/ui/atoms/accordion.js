import * as React from 'react';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { View } from 'app/design/view';
import * as AccordionPrimitive from 'app/ui/primitives/accordion';
import { clsx } from 'clsx';
import { Icon } from 'app/ui/atoms/icon';
import { Text } from 'app/design/typography';
import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { useSound } from 'app/lib/hooks/useSound';

const accordionTheme = appSetting('theme', 'accordion') ?? {};

const Accordion = React.forwardRef(({ className, ...props }, ref) => (
    <AccordionPrimitive.Root
        ref={ref}
        className={clsx(accordionTheme.root, className)}
        {...props}
    />
));
Accordion.displayName = AccordionPrimitive.Root.displayName;

const AccordionItem = React.forwardRef(({ className, ...props }, ref) => (
    <AccordionPrimitive.Item
        ref={ref}
        className={clsx(accordionTheme.item, className)}
        {...props}
    />
));
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

/**
 * Title row label — uses theme `accordion.trigger_text`. Pass `className` to override or extend.
 */
const AccordionTriggerTitle = React.forwardRef(
    ({ className, children, ...props }, ref) => (
        <Text
            ref={ref}
            className={clsx(accordionTheme.trigger_text, className)}
            {...props}
        >
            {children}
        </Text>
    )
);
AccordionTriggerTitle.displayName = 'AccordionTriggerTitle';

const AccordionTrigger = React.forwardRef(
    (
        {
            className,
            titleClassName,
            title,
            children,
            chevronClassName,
            onPress,
            /** When false, skips `FeedbackHaptics` + native click sound (web still uses web-haptics only if you call it — here we skip all feedback). */
            feedback = true,
            ...props
        },
        ref
    ) => {
        const isWeb = Platform.OS === 'web';
        const playClick = useSound('click');
        /** Native: `click` asset when `layout.sounds`. Web: [web-haptics](https://github.com/lochie/web-haptics) `nudge` + synth when `layout.sounds` + `layout.web_haptics_sounds` (see `feedback-haptics.web.js`); skip `useSound` on web to avoid doubling. */
        const handlePress = useCallback(
            (event) => {
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
                    ref={ref}
                    className={clsx(accordionTheme.trigger, className)}
                    {...props}
                    onPress={handlePress}
                >
                    {({ isExpanded }) => (
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
                                        className={clsx(
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
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef(
    ({ className, innerClassName, children, ...props }, ref) => (
        <AccordionPrimitive.Content
            ref={ref}
            className={clsx(accordionTheme.content, className)}
            {...props}
        >
            <View className={clsx(accordionTheme.content_inner, innerClassName)}>
                {children}
            </View>
        </AccordionPrimitive.Content>
    )
);
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionTriggerTitle,
    AccordionContent,
};
