import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Menu from 'app/components/menu';
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

const ZERO_TIME = { hours: 0, minutes: 0, seconds: 0 };

let pendingLogTimerId = null;

function isLogAction(item) {
    const name = String(item?.name || item?.action || '').toLowerCase();
    const title = String(item?.title || '').toLowerCase();
    return (
        name === 'log' ||
        name === 'report_time' ||
        name === 'report-time' ||
        title === 'log'
    );
}

function isTimerPayload(data) {
    return Boolean(
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        (data.state != null || data.time != null || data.actions != null)
    );
}

function idsMatch(left, right) {
    if (left == null || right == null || left === '' || right === '') return false;
    return String(left) === String(right);
}

function isThisTimer(eventId, timerData) {
    const thisId = timerData?.id;
    if (idsMatch(eventId, thisId) || idsMatch(eventId, timerData?.timer_id)) {
        return true;
    }
    // Report form may send task id / empty id — fall back to the timer that was clicked.
    return idsMatch(pendingLogTimerId, thisId);
}

function TimerDisplay({ data, resetNonce = 0 }) {
    const isRunning = data?.state === 'started';

    const [totalSeconds, setTotalSeconds] = useState(() =>
        toTotalSeconds(data?.time || data || {})
    );

    useEffect(() => {
        setTotalSeconds(toTotalSeconds(data?.time || {}));
    }, [data?.time?.hours, data?.time?.minutes, data?.time?.seconds, resetNonce]);

    useEffect(() => {
        if (!isRunning) return undefined;

        const interval = setInterval(() => {
            setTotalSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    const parts = fromTotalSeconds(totalSeconds);

    return (
        <Row className="items-center gap-2 flex-none">
            <View className="w-5 h-5 items-center justify-center">
            <Icon icon="Clock" size={16} className="text-muted-foreground" />
            </View>
            <Text className="font-mono text-base font-semibold tabular-nums text-foreground">
                {formatTimerParts(parts.hours, parts.minutes, parts.seconds)}
            </Text>
        </Row>
    );
}


export function TaskTimer({ data, className }) {
    const [timerData, setTimerData] = useState(data);
    const [resetNonce, setResetNonce] = useState(0);
    const timerDataRef = useRef(timerData);
    timerDataRef.current = timerData;

    const applyTimerData = useCallback((next, { zeroTime = false } = {}) => {
        if (!next && !zeroTime) return;

        if (zeroTime) {
            setResetNonce((n) => n + 1);
            setTimerData((prev) => ({
                ...(next || prev),
                time: { ...ZERO_TIME },
            }));
            return;
        }

        setTimerData(next);
    }, []);

    const refreshTimer = useCallback(async ({ zeroTime = false } = {}) => {
        const requestUrl = timerDataRef.current?.request_url;
        if (!requestUrl) {
            if (zeroTime) applyTimerData(null, { zeroTime: true });
            return;
        }

        const response = await fetcher('/api.php?r=' + requestUrl);
        if (isTimerPayload(response?.data)) {
            applyTimerData(response.data, { zeroTime });
            return;
        }

        if (zeroTime) applyTimerData(null, { zeroTime: true });
    }, [applyTimerData]);

    const runCallback = useCallback(async (item, timerId) => {
        const requestUrl = item?.data?.request_url;
        const logAction = isLogAction(item);

        if (logAction) {
            pendingLogTimerId = timerId ?? timerDataRef.current?.id ?? null;
        }

        if (!requestUrl) {
            if (logAction) {
                emitter.emit('task_timer', { id: timerId, action: 'log' });
            }
            return;
        }

        const response = await fetcher('/api.php?r=' + requestUrl);

        if (logAction) {
            applyTimerData(
                isTimerPayload(response?.data) ? response.data : null,
                { zeroTime: true }
            );
            emitter.emit('task_timer', { id: timerId, action: 'log' });
            return;
        }

        if (response?.data) {
            setTimerData(response.data);
        }

        emitter.emit('task_timer', { id: timerId, action: item.name });
    }, [applyTimerData]);

    useEffect(() => {
        const subscription = emitter.addListener('task_timer', (event) => {
            if (event.action == 'log' && isThisTimer(event.id, timerDataRef.current)) {
                pendingLogTimerId = null;
                void refreshTimer({ zeroTime: true });
                return;
            }

            if ((event.action == 'start' || event.action == 'resume' || event.action == 'log') && timerDataRef.current?.state === 'started') {
                void refreshTimer();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [refreshTimer]);

    const markPendingLog = useCallback(() => {
        pendingLogTimerId = timerDataRef.current?.id ?? null;
    }, []);

    const menuParams = useMemo(() => ({
        className: 'gap-x-1',
        button_style: 'bordered',
        button_size: 'mini',
        button_border_shape: 'capsule',
        button_full_width: false,
        show_action: true,
        show_counter: true,
        show_combined: true,
        isFixedCount: true,
        timer_id: timerData?.id,
        onclick: (event, item) => runCallback(item, timerDataRef.current?.id),
    }), [runCallback, timerData?.id]);


    const callbackCount = timerData?.actions?.items.filter((item) => item.display_type === 'callback').length;
    const actionItems = (timerData?.actions?.items || []).map((item) =>
        item.display_type === 'callback'
            ? { ...item, display_type: 'button' }
            : item
    );


    if (!timerData) return null;

    return (
        <Row
            className={cn('w-full items-center gap-3 flex-wrap', className)}
            onTouchStart={markPendingLog}
            {...(Platform.OS === 'web' ? { onClick: markPendingLog } : {})}
        >
            <TimerDisplay data={timerData} resetNonce={resetNonce} />
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
