import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

/**
 * Параметры:
 * - pulseDurationMs: длительность ОДНОГО пульса (вниз-вверх), по умолчанию 3000
 * - pulses: сколько раз пульсировать (целое >= 1), по умолчанию 1
 * - minOpacity: "глубина" пульса (0..1), по умолчанию 0.5
 * - autoStart: автозапуск при маунте, по умолчанию true
 * - respectReducedMotion: учитывать системную настройку "уменьшение анимации", по умолчанию true
 * - onEnd: колбэк по завершении всех пульсов
 */
export function usePulseOne({
    pulseDurationMs = 3000,
    pulses = 1,
    minOpacity = 0.5,
    autoStart = true,
    respectReducedMotion = true,
    onEnd,
} = {}) {
    const opacity = useRef(new Animated.Value(1)).current;
    const runningRef = useRef(null); // текущая анимация, чтобы остановить при unmount

    // Один пульс: 1 -> minOpacity -> 1
    const onePulse = useMemo(() => {
        const down = Math.max(1, Math.floor(pulseDurationMs / 2));
        const up = Math.max(1, pulseDurationMs - down);
        return Animated.sequence([
            Animated.timing(opacity, { toValue: minOpacity, duration: down, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: up, useNativeDriver: true }),
        ]);
    }, [opacity, pulseDurationMs, minOpacity]);

    const buildAnimation = useCallback(() => {
        if (pulses <= 1) return onePulse;
        // Запускаем onePulse N раз
        return Animated.loop(onePulse, { iterations: pulses });
    }, [onePulse, pulses]);

    const start = useCallback(async () => {
        // если 0 пульсов — просто сразу завершить
        if (!pulses || pulses < 1) {
            opacity.setValue(1);
            onEnd && onEnd();
            return;
        }

        try {
            if (respectReducedMotion && AccessibilityInfo.isReduceMotionEnabled) {
                const reduced = await AccessibilityInfo.isReduceMotionEnabled();
                if (reduced) {
                    opacity.setValue(1);
                    onEnd && onEnd();
                    return;
                }
            }
        } catch {
            // молча игнорируем сбои AccessibilityInfo
        }

        const anim = buildAnimation();
        runningRef.current = anim;
        anim.start(({ finished }) => {
            if (finished && onEnd) onEnd();
        });
    }, [pulses, opacity, respectReducedMotion, buildAnimation, onEnd]);

    useEffect(() => {
        if (autoStart) start();
        return () => {
            // остановить при размонтировании
            if (runningRef.current?.stop) runningRef.current.stop();
            opacity.stopAnimation();
        };
    }, [autoStart, start, opacity]);

    const reset = useCallback(() => {
        if (runningRef.current?.stop) runningRef.current.stop();
        opacity.setValue(1);
    }, [opacity]);

    return { animatedStyle: { opacity }, start, reset };
}
