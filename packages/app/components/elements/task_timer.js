import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import Menu from 'app/components/menu';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { fetcher } from 'app/lib/fetcher';
import emitter from 'app/context/emitter';

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

function splitActionItems(items = []) {
    const controls = [];
    const elements = [];

    for (const item of items) {
        if (item.display_type === 'element') {
            elements.push(item);
        } else {
            controls.push(item);
        }
    }

    return { controls, elements };
}

function TimerDisplay({ data }) {
    const isRunning = useMemo(
        () => (data?.actions?.items || []).some((item) => item.name === 'pause'),
        [data?.actions?.items]
    );

    const [totalSeconds, setTotalSeconds] = useState(() =>
        toTotalSeconds(data || {})
    );

    useEffect(() => {
        setTotalSeconds(toTotalSeconds(data || {}));
    }, [data?.hours, data?.minutes, data?.seconds]);

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
            <Icon icon="Clock" size={16} className="text-muted-foreground" />
            <Text className="font-mono text-base font-semibold tabular-nums text-foreground">
                {formatTimerParts(parts.hours, parts.minutes, parts.seconds)}
            </Text>
        </Row>
    );
}

function TimerControls({ items }) {
    const runCallback = useCallback(async (item) => {
        const requestUrl = item?.data?.request_url;
        if (!requestUrl) return;

        await fetcher('/api.php?r=' + requestUrl);
        emitter.emit('page', { action: 'reload' });
    }, []);

    if (!items.length) return null;

    return (
        <Row className="flex-none flex-wrap items-center gap-1">
            {items.map((item) => (
                <Button
                    key={item.name}
                    size="sm"
                    variant={item.primary ? 'primary' : 'default'}
                    title={item.title || item.name}
                    onPress={() => runCallback(item)}
                />
            ))}
        </Row>
    );
}

const MENU_PARAMS = {
    className: 'gap-x-1',
    button_variant: 'default',
    button_size: 'sm',
    button_rounded: true,
    button_full_width: false,
    show_action: true,
    show_counter: true,
    show_combined: true,
};

export default function ElementTaskTimer({ data, blockWrapperProps }) {
    const actionItems = data?.actions?.items || [];
    const { controls, elements } = useMemo(
        () => splitActionItems(actionItems),
        [actionItems]
    );

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Row className="w-full items-center gap-3">
                <TimerDisplay data={data} />

                <View className="flex-auto min-w-0">
                    <Row className="flex-wrap items-center justify-end gap-2">
                        <TimerControls items={controls} />

                        {elements.length > 0 ? (
                            <Menu
                                {...data.actions}
                                items={elements}
                                alignItems="start"
                                autoSize
                                autoFilter={false}
                                params={MENU_PARAMS}
                            />
                        ) : null}
                    </Row>
                </View>
            </Row>
        </BlockWrapper>
    );
}
