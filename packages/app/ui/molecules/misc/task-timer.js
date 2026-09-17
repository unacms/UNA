import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Menu from 'app/components/menu';
import { Icon } from 'app/ui/atoms/icon';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
import emitter from 'app/context/emitter';

const TIMER_EVENT = 'task_timer';
const ZERO_TIME = { hours: 0, minutes: 0, seconds: 0 };

const MENU_PARAMS = {
    className: 'gap-x-1',
    button_style: 'bordered',
    button_size: 'mini',
    button_border_shape: 'capsule',
    button_full_width: false,
    show_action: true,
    show_counter: true,
    show_combined: true,
    isFixedCount: true,
};

/** Timer whose "Log" was clicked last — the report form may answer with a task id or no id at all. */
let pendingLogTimerId = null;

function pad2(value) {
    return String(value).padStart(2, '0');
}

function toTotalSeconds({ hours = 0, minutes = 0, seconds = 0 } = {}) {
    return hours * 3600 + minutes * 60 + seconds;
}

function formatTotalSeconds(total) {
    const safe = Math.max(0, total);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(safe % 60)}`;
}

function isLogAction(item) {
    const name = String(item?.name || item?.action || '').toLowerCase();
    return name === 'log'
        || name === 'report_time'
        || name === 'report-time'
        || String(item?.title || '').toLowerCase() === 'log';
}

function isTimerPayload(data) {
    return !!data
        && typeof data === 'object'
        && !Array.isArray(data)
        && (data.state != null || data.time != null || data.actions != null);
}

function idsMatch(left, right) {
    if (left == null || right == null || left === '' || right === '') return false;
    return String(left) === String(right);
}

function isThisTimer(eventId, timerData) {
    return idsMatch(eventId, timerData?.id)
        || idsMatch(eventId, timerData?.timer_id)
        || idsMatch(pendingLogTimerId, timerData?.id);
}

/** Ticks every second while `state === 'started'`; resets when server time or `resetNonce` changes. */
function TimerDisplay({ data, resetNonce = 0 }) {
    const isRunning = data?.state === 'started';
    const baseSeconds = toTotalSeconds(data?.time || data);
    const resetKey = `${baseSeconds}|${resetNonce}`;

    const [totalSeconds, setTotalSeconds] = useState(baseSeconds);
    const [seenResetKey, setSeenResetKey] = useState(resetKey);
    if (seenResetKey !== resetKey) {
        setSeenResetKey(resetKey);
        setTotalSeconds(baseSeconds);
    }

    useEffect(() => {
        if (!isRunning) return undefined;
        const interval = setInterval(() => setTotalSeconds((prev) => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [isRunning]);

    return (
        <Row className="items-center gap-2 flex-none">
            <View className="w-5 h-5 items-center justify-center">
                <Icon icon="Clock" size={16} className="text-muted-foreground" />
            </View>
            <Text className="font-mono text-base font-semibold tabular-nums text-foreground">
                {formatTotalSeconds(totalSeconds)}
            </Text>
        </Row>
    );
}

export function TaskTimer({ data, className }) {
    const [timerData, setTimerData] = useState(data);
    const [resetNonce, setResetNonce] = useState(0);
    const timerId = timerData?.id;
    const requestUrl = timerData?.request_url;
    const isRunning = timerData?.state === 'started';

    /** `zeroTime` restarts the display from 00:00:00 (after logging time). */
    const applyTimerData = useCallback((next, { zeroTime = false } = {}) => {
        if (!zeroTime) {
            if (next) setTimerData(next);
            return;
        }
        setResetNonce((n) => n + 1);
        setTimerData((prev) => ({ ...(next || prev), time: { ...ZERO_TIME } }));
    }, []);

    const refreshTimer = useCallback(async ({ zeroTime = false } = {}) => {
        const response = requestUrl ? await fetcher('/api.php?r=' + requestUrl) : null;
        const next = isTimerPayload(response?.data) ? response.data : null;
        if (next || zeroTime) applyTimerData(next, { zeroTime });
    }, [requestUrl, applyTimerData]);

    useEffect(() => {
        const subscription = emitter.addListener(TIMER_EVENT, (event) => {
            if (event.action === 'log' && isThisTimer(event.id, timerData)) {
                pendingLogTimerId = null;
                refreshTimer({ zeroTime: true });
                return;
            }
            // Only one timer can run per profile — starting another one stops this one.
            if (isRunning && ['start', 'resume', 'log'].includes(event.action)) {
                refreshTimer();
            }
        });
        return () => subscription.remove();
    }, [timerData, isRunning, refreshTimer]);

    const runAction = async (item) => {
        const actionUrl = item?.data?.request_url;
        const logAction = isLogAction(item);
        if (logAction) pendingLogTimerId = timerId ?? null;

        if (!actionUrl) {
            if (logAction) emitter.emit(TIMER_EVENT, { id: timerId, action: 'log' });
            return;
        }

        const response = await fetcher('/api.php?r=' + actionUrl);
        if (logAction) {
            applyTimerData(isTimerPayload(response?.data) ? response.data : null, { zeroTime: true });
            emitter.emit(TIMER_EVENT, { id: timerId, action: 'log' });
            return;
        }
        if (response?.data) setTimerData(response.data);
        emitter.emit(TIMER_EVENT, { id: timerId, action: item.name });
    };

    const markPendingLog = () => {
        pendingLogTimerId = timerId ?? null;
    };

    if (!timerData) return null;

    const actionItems = (timerData.actions?.items || []).map((item) => (
        item.display_type === 'callback' ? { ...item, display_type: 'button' } : item
    ));
    const callbackCount = (timerData.actions?.items || [])
        .filter((item) => item.display_type === 'callback').length;

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
                        params={{ ...MENU_PARAMS, timer_id: timerId, onclick: (event, item) => runAction(item) }}
                    />
                </Row>
            </View>
        </Row>
    );
}
