import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Menu from 'app/components/menu';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
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



function TimerDisplay({ data }) {
    const isRunning = data?.state === 'started';

    const [totalSeconds, setTotalSeconds] = useState(() =>
        toTotalSeconds(data || {})
    );

    useEffect(() => {
        setTotalSeconds(toTotalSeconds(data?.time || {}));
    }, [data?.time?.hours, data?.time?.minutes, data?.time?.seconds]);

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


export function TaskTimer({ data, className }) {
    const [timerData, setTimerData] = useState(data);

    const runCallback = useCallback(async (item, timerId) => {
      
       
        const requestUrl = item?.data?.request_url;

        if (!requestUrl) return;
        
        const response = await fetcher('/api.php?r=' + requestUrl);
        
        if (response?.data && item.name !== 'log') {
            setTimerData(response.data);
        }

        emitter.emit('task_timer', { id: timerId, action: item.name });
        
    }, []);

    const runCallback2 = useCallback(async () => {
      
      
        const requestUrl = timerData?.request_url;

        if (!requestUrl) return;
        
        const response = await fetcher('/api.php?r=' + requestUrl);
        if (response?.data) {
            setTimerData(response.data);
        }

    }, []);

    useEffect(() => {
        const subscription = emitter.addListener(`task_timer`, (data) => {
            if (data.id !== timerData.id && (data.action == 'start' || data.action == 'resume' || data.action == 'log') && timerData.state === 'started') {
                runCallback2()
            }
        })

        return () => {
            subscription.remove()
        }
    }, [timerData])


    const menuParams = useMemo(() => ({
        ...{
            className: 'gap-x-1',
            button_variant: 'default',
            button_size: 'sm',
            button_rounded: true,
            button_full_width: false,
            show_action: true,
            show_counter: true,
            show_combined: true,
            isFixedCount: true,
        },
        onclick: (event, item) => runCallback(item, timerData.id),
    }), [runCallback]);


    const callbackCount = timerData?.actions?.items.filter((item) => item.display_type === 'callback').length;
    console.log("callbackCount", callbackCount)
    const actionItems = (timerData?.actions?.items || []).map((item) =>
        item.display_type === 'callback'
            ? { ...item, display_type: 'button' }
            : item
    );


    console.log("actionItems", actionItems)
    if (!timerData) return null;

    return (
        <Row className={cn('w-full items-center gap-3', className)}>
            <TimerDisplay data={timerData} />
            <View className="flex-auto min-w-0">
                <Row className="flex-wrap items-center justify-end gap-2">
                        <Menu
                            {...timerData.actions}
                            persistent={callbackCount}
                            items={actionItems}
                            alignItems="start"
                            autoSize
                            autoFilter={false}
                            params={menuParams}
                        />
                </Row>
            </View>
        </Row>
    );
}
