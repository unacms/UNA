import { useState } from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper';
import { Icon } from 'app/ui/atoms/icon';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';

/** One step of UNA's setup checklist (BxDolTours::getSetupSteps, sent by system/get_block_setup). */
export interface SetupStep {
    name: string;
    /** Lucide name: CircleUserRound, Target, GalleryVertical, SquarePen. */
    icon?: string;
    done?: boolean;
    /** Waits for an earlier step (posting waits for a profile). */
    locked?: boolean;
    title?: string;
    /** "done" or "not done yet", for screen readers. */
    state?: string;
    text?: string;
    /** An app path (`/account-profile-switcher`) or a full link to Studio; empty when the step has no action here. */
    url?: string;
    action?: string;
}

export interface SetupChecklistData {
    steps?: SetupStep[];
    join?: { text?: string; url?: string; action?: string; label?: string };
    dismiss?: { title?: string; request_url?: string };
}

/**
 * A step's icon on a 40px tile, as on UNA's site (template/css/homepage.css): green with a check badge when the step is
 * done, a lock badge while it waits for another step.
 */
function StepIcon({ step }: Readonly<{ step: SetupStep }>) {
    let badge: string | null = null;
    if (step.done) badge = 'Check';
    else if (step.locked) badge = 'Lock';

    return (
        <View
            aria-hidden
            className={cn(
                'relative h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                step.done ? 'bg-green-100 dark:bg-green-400/15' : 'bg-button',
            )}
        >
            <Icon
                icon={step.icon || 'Circle'}
                size={20}
                className={step.done ? 'text-green-700 dark:text-green-400' : 'text-secondary-foreground'}
            />
            {badge ? (
                <View
                    className={cn(
                        'absolute -bottom-1 -right-1 h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-card',
                        step.done ? 'bg-green-700 dark:bg-green-400' : 'bg-neutral-500 dark:bg-neutral-400',
                    )}
                >
                    <Icon icon={badge} size={11} strokeWidth={3} className="text-white dark:text-neutral-900" />
                </View>
            ) : null}
        </View>
    );
}

/**
 * UNA's "Set up your site" block of the home page, for operators: each step with its icon, done or not, and the place
 * where it is done (Studio opens in the browser), then who can join and the setting for it. The block's title and
 * description (the progress) are the block's own; "Hide this checklist" tells UNA (system/setup_dismiss) and removes
 * the block, as its menu does on the site.
 */
export default function SetupChecklist({ data, blockWrapperProps }: Readonly<{ data?: SetupChecklistData; blockWrapperProps?: any }>) {
    const [hidden, setHidden] = useState(false);
    const steps = Array.isArray(data?.steps) ? data.steps : [];
    if (hidden || !steps.length)
        return null;

    const firstOpen = steps.find((step) => !step.done && !step.locked && step.url)?.name;

    const dismiss = () => {
        setHidden(true);
        if (data?.dismiss?.request_url)
            fetcher('/api.php?r=' + data.dismiss.request_url).catch((err: unknown) => {
                console.warn('Setup checklist: could not tell UNA it was hidden:', err);
            });
    };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full">
                {steps.map((step, index) => (
                    <View
                        key={step.name}
                        className={cn('flex-row flex-wrap items-center gap-3 py-3', index > 0 ? 'border-t border-border' : 'pt-0')}
                    >
                        <StepIcon step={step} />
                        <View className="min-w-0 flex-1 basis-48">
                            <Text
                                className={cn('text-base leading-6 font-medium', step.done ? 'text-muted-foreground' : 'text-foreground')}
                                accessibilityLabel={step.state ? `${step.title}, ${step.state}` : step.title}
                            >
                                {step.title}
                            </Text>
                            {step.text ? <Text className="text-sm leading-5 text-muted-foreground">{step.text}</Text> : null}
                        </View>
                        {!step.done && !step.locked && step.url && step.action ? (
                            <NeoButtonLink
                                href={step.url}
                                label={step.action}
                                style={step.name === firstOpen ? 'borderedProminent' : 'bordered'}
                                controlSize="small"
                            />
                        ) : null}
                    </View>
                ))}
                {data?.join?.text ? (
                    <View className="flex-row flex-wrap items-center gap-3 border-t border-border pt-3">
                        <View aria-hidden className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-button">
                            <Icon icon="UserPlus" size={20} className="text-secondary-foreground" />
                        </View>
                        <Text className="min-w-0 flex-1 basis-48 text-base leading-6 font-medium text-foreground">{data.join.text}</Text>
                        {data.join.url ? (
                            <NeoButtonLink
                                href={data.join.url}
                                label={data.join.action}
                                accessibilityLabel={data.join.label}
                                style="bordered"
                                controlSize="small"
                            />
                        ) : null}
                    </View>
                ) : null}
                {data?.dismiss?.title ? (
                    <View className="flex-row justify-end pt-3">
                        <NeoButton label={data.dismiss.title} style="borderless" controlSize="small" onPress={dismiss} />
                    </View>
                ) : null}
            </View>
        </BlockWrapper>
    );
}
