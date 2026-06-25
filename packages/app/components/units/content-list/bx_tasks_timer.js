import { useEffect, useMemo, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Menu from 'app/components/menu';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile';
import { Icon } from 'app/ui/atoms/icon';
import { Card } from 'app/ui/molecules/card';

function pad2(value) {
    return String(value).padStart(2, '0');
}

function formatTimerParts(hours, minutes, seconds) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function toTotalSeconds({ hours = 0, minutes = 0, seconds = 0 }) {
    return hours * 3600 + minutes * 60 + seconds;
}

function fromTotalSeconds(total) {
    const safe = Math.max(0, total);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    return { hours, minutes, seconds };
}

function TimerDisplay({ timer }) {
    const isRunning = useMemo(
        () => (timer?.actions?.items || []).some((item) => item.name === 'pause'),
        [timer?.actions?.items]
    );

    const [totalSeconds, setTotalSeconds] = useState(() =>
        toTotalSeconds(timer || {})
    );

    useEffect(() => {
        setTotalSeconds(toTotalSeconds(timer || {}));
    }, [timer?.hours, timer?.minutes, timer?.seconds]);

    useEffect(() => {
        if (!isRunning) return undefined;

        const interval = setInterval(() => {
            setTotalSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    const parts = fromTotalSeconds(totalSeconds);

    return (
        <Row className="items-center gap-1.5 flex-none">
            <Icon
                icon="Clock"
                size={16}
                className="text-muted-foreground"
            />
            <Text className="font-mono text-base font-semibold tabular-nums text-foreground">
                {formatTimerParts(parts.hours, parts.minutes, parts.seconds)}
            </Text>
        </Row>
    );
}

export default function Unit({ data }) {
    const context = data?.context;
    const timer = data?.timer;
    const actions = timer?.actions;

    return (
        <Card padding="p-3" className="web:hover:bg-muted/30 web:duration-300">
            {context?.display_name ? (
                <Link href={context.url} emulate>
                    <Row className="items-center gap-2 mb-2">
                        <Profile
                            url_avatar={context.url_avatar}
                            display_name={context.display_name}
                            displayType="unit_wo_info"
                            displaySize="xs"
                        />
                        <Text
                            numberOfLines={1}
                            className="text-xs font-medium text-muted-foreground flex-auto"
                        >
                            {context.display_name}
                        </Text>
                    </Row>
                </Link>
            ) : null}

            <Row className="items-center gap-3">
                <View className="flex-auto min-w-0 gap-1">
                    <Link href={data.content_url} emulate>
                        <Text
                            numberOfLines={2}
                            className="text-sm font-semibold text-card-foreground web:hover:text-foreground leading-tight"
                        >
                            {data.content_title}
                        </Text>
                    </Link>
                </View>

                <TimerDisplay timer={timer} />

                {actions?.items?.length ? (
                    <View className="flex-none">
                        <Menu
                            {...actions}
                            alignItems="start"
                            autoSize
                            autoFilter={false}
                            params={{
                                className: 'gap-x-1',
                                button_variant: 'default',
                                button_size: 'sm',
                                button_rounded: true,
                                button_full_width: false,
                                show_action: true,
                                show_counter: true,
                                show_combined: true,
                            }}
                        />
                    </View>
                ) : null}
            </Row>
        </Card>
    );
}
