'use client';

import { useEffect, useRef, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { useResolvedNeoButton } from 'app/design/controls/neo-button/neo-button';
import { cn } from 'app/lib/util';
import { clockToSeconds, estimateToSeconds, formatTaskClock, parseTaskTime } from 'app/lib/tasks-meta';
import { useTaskTimerSession } from 'app/lib/task-timer-sync';

/** Advance from a snapshot using wall-clock so background tabs catch up. */
export function useLiveSeconds(baseSeconds, isRunning) {
    const originRef = useRef(null);
    const [now, setNow] = useState(() => Date.now());
    const safeBase = Math.max(0, Number(baseSeconds) || 0);

    if (!isRunning) {
        originRef.current = null;
    } else if (!originRef.current || originRef.current.base !== safeBase) {
        originRef.current = { at: Date.now(), base: safeBase };
    }

    useEffect(() => {
        if (!isRunning) return undefined;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [isRunning]);

    if (!isRunning || !originRef.current) return safeBase;
    return originRef.current.base + Math.max(0, Math.floor((now - originRef.current.at) / 1000));
}

function isStarted(value) {
    const key = String(value || '').trim().toLowerCase();
    return value === true || value === 1 || value === '1'
        || key === 'started' || key === 'running' || key === 'start';
}

function resolveTimerValue({ time, logged, estimate, running, state, timer, session }) {
    const timerObj = timer && typeof timer === 'object' && !Array.isArray(timer) ? timer : null;
    const parsed = parseTaskTime(time);
    const loggedSeconds = clockToSeconds(logged) ?? parsed.loggedSeconds ?? 0;
    const estimateSeconds = estimateToSeconds(estimate) ?? parsed.estimateSeconds;
    const sessionSeconds = clockToSeconds(timerObj?.time)
        ?? (session?.seconds != null ? session.seconds : null)
        ?? 0;
    const runningFromFlag = running === true || running === false
        ? running
        : isStarted(state) || isStarted(timerObj?.state) || isStarted(session?.state);

    // Session time is unlogged work. Add it to Total; if browse has no Total, show the session.
    const currentSeconds = runningFromFlag || (!loggedSeconds && sessionSeconds)
        ? loggedSeconds + sessionSeconds
        : loggedSeconds;

    return {
        currentSeconds: currentSeconds || 0,
        estimateSeconds,
        isRunning: !!runningFromFlag,
        hasLogged: loggedSeconds > 0 || sessionSeconds > 0 || currentSeconds > 0 || parsed.logged != null,
        hasEstimate: estimateSeconds != null && estimateSeconds > 0,
    };
}

export function Timer({
    time,
    logged,
    estimate,
    running,
    state,
    timer,
    taskId,
    controlSize = 'mini',
    showSeconds,
    className,
}) {
    const resolved = useResolvedNeoButton({
        controlSize,
        borderShape: 'capsule',
        style: 'bordered',
    });
    const session = useTaskTimerSession(taskId);
    const value = resolveTimerValue({ time, logged, estimate, running, state, timer, session });
    const liveSeconds = useLiveSeconds(value.currentSeconds, value.isRunning);

    if (!value.hasLogged && !value.hasEstimate && !value.isRunning) return null;

    const over = value.hasEstimate && liveSeconds > value.estimateSeconds;
    const fillPercent = !value.hasEstimate
        ? 0
        : (over ? 100 : Math.round((liveSeconds / value.estimateSeconds) * 1000) / 10);
    const showFill = value.hasEstimate && fillPercent > 0;
    const secondsVisible = showSeconds === true || (showSeconds !== false && value.isRunning);
    const loggedLabel = !value.hasLogged && liveSeconds === 0
        ? '0'
        : formatTaskClock(liveSeconds, { showSeconds: secondsVisible });
    const estimateLabel = value.hasEstimate
        ? formatTaskClock(value.estimateSeconds, { showSeconds: secondsVisible })
        : null;
    const label = estimateLabel ? `${loggedLabel} / ${estimateLabel}` : loggedLabel;
    const padStyle = resolved.paddingXCls
        ? undefined
        : { paddingLeft: resolved.paddingX, paddingRight: resolved.paddingX };

    return (
        <View
            className={cn(
                'relative isolate shrink-0 overflow-hidden border border-border bg-card',
                resolved.heightCls,
                resolved.rounded,
                className
            )}
            style={{ height: resolved.height }}
            accessibilityRole={value.hasEstimate ? 'progressbar' : undefined}
            accessibilityLabel={value.isRunning ? `Timer ${label}` : (estimateLabel ? `${loggedLabel} of ${estimateLabel}` : label)}
            accessibilityValue={value.hasEstimate ? { min: 0, max: 100, now: Math.round(fillPercent) } : undefined}
            accessibilityState={value.isRunning ? { busy: true } : undefined}
        >
            {showFill ? (
                <View
                    pointerEvents="none"
                    className={cn('absolute inset-px overflow-hidden', resolved.rounded)}
                >
                    <View
                        className={cn(
                            'h-full',
                            resolved.rounded,
                            over ? 'bg-destructive/40' : 'bg-green/40'
                        )}
                        style={{ width: `${fillPercent}%` }}
                    />
                </View>
            ) : null}
            <Row
                className={cn(
                    'relative items-center h-full',
                    resolved.paddingXCls,
                    resolved.labelGapCls || 'gap-x-1'
                )}
                style={padStyle}
            >
                <Icon
                    icon="Clock"
                    size={resolved.iconSize}
                    className="shrink-0 text-foreground"
                />
                <Text
                    className={cn(
                        resolved.fontCls,
                        'font-medium tabular-nums whitespace-nowrap text-foreground'
                    )}
                >
                    {label}
                </Text>
            </Row>
        </View>
    );
}

export default Timer;
