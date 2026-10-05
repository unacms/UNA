import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import Menu from 'app/components/menu';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
import emitter, { EVENTS } from 'app/context/emitter';
import { Timer } from 'app/ui/atoms/timer';
import { publishTimerSession } from 'app/lib/task-timer-sync';

const TIMER_EVENT = EVENTS.taskTimer;
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

/** Capsule clock; ticks while `state === 'started'`. `resetNonce` remounts after a log. */
function TimerDisplay({ data, resetNonce = 0 }) {
    return (
        <Timer
            key={resetNonce}
            time={data?.time}
            running={data?.state === 'started'}
            controlSize="mini"
            showSeconds
        />
    );
}

export function TaskTimer({ data, className }) {
    const [timerData, setTimerData] = useState(data);
    const [resetNonce, setResetNonce] = useState(0);
    const timerId = timerData?.id;
    const requestUrl = timerData?.request_url;
    const isRunning = timerData?.state === 'started';

    useEffect(() => {
        publishTimerSession({
            requestUrl: timerData?.request_url,
            timerId: timerData?.id,
            state: timerData?.state,
            time: timerData?.time,
        });
    }, [timerData]);

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
            publishTimerSession({
                requestUrl,
                timerId,
                action: 'log',
                time: ZERO_TIME,
            });
            return;
        }

        const response = await fetcher('/api.php?r=' + actionUrl);
        if (logAction) {
            applyTimerData(isTimerPayload(response?.data) ? response.data : null, { zeroTime: true });
            emitter.emit(TIMER_EVENT, { id: timerId, action: 'log' });
            publishTimerSession({
                requestUrl: response?.data?.request_url || actionUrl || requestUrl,
                timerId,
                action: 'log',
                state: response?.data?.state,
                time: ZERO_TIME,
            });
            return;
        }
        if (response?.data) setTimerData(response.data);
        emitter.emit(TIMER_EVENT, { id: timerId, action: item.name });
        publishTimerSession({
            requestUrl: response?.data?.request_url || actionUrl || requestUrl,
            timerId: response?.data?.id ?? timerId,
            action: item.name,
            state: response?.data?.state,
            time: response?.data?.time,
        });
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
