import { useCallback } from 'react'
import { Platform } from 'react-native'
import { useKeyboardHandler } from 'react-native-keyboard-controller'
import { runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'

const isIos = Platform.OS === 'ios'

/**
 * Chat lists: move the rows up with the keyboard, in step with the KbStickyView
 * composer, and let a drag down the list pull the keyboard away (interactive
 * dismiss). Same recipe as LegendList's KeyboardAvoidingLegendList, kept on
 * UniList's own scroll worklet: iOS grows `contentInset.bottom` and shifts the
 * offset by the same amount; Android shrinks the list from the bottom.
 *
 * `bottomOffset` is the part of the keyboard the screen already pads for (the
 * tab bar under the composer), so the rows rise exactly as far as the composer.
 * `animating` is set while the keyboard drives the offset (the end clamp waits).
 * A list that was at its end when the keyboard moved settles at the real end
 * afterwards (`snapToEnd`), so a message sent as the keyboard closes still
 * lands above the composer.
 */
export function useChatKeyboard({ enabled, bottomOffset, scrollY, atEnd, animating, listRef, snapToEnd }: {
    enabled: boolean
    bottomOffset: number
    scrollY: SharedValue<number>
    atEnd: SharedValue<boolean>
    animating: SharedValue<boolean>
    listRef: { current: any }
    snapToEnd: (animated?: boolean) => void
}) {
    const keyboardInset = useSharedValue(0)
    const offsetY = useSharedValue<number | null>(null)
    const offsetAtStart = useSharedValue(0)
    const lift = useSharedValue(0)
    const opening = useSharedValue(false)
    // The finger drags the keyboard (interactive dismiss): the list scrolls itself.
    const interactive = useSharedValue(false)
    const keyboardOpen = useSharedValue(false)
    const wasAtEnd = useSharedValue(false)

    // LegendList recomputes its window on every offset change; hold it while
    // the keyboard drives the offset, as KeyboardAvoidingLegendList does.
    const setScrollProcessing = useCallback((on: boolean) => {
        listRef.current?.setScrollProcessingEnabled?.(on)
    }, [listRef])

    useKeyboardHandler({
        onStart: (event) => {
            'worklet'
            if (!enabled) return
            animating.set(true)
            // Already open and only resizing (another keyboard): keep the offset.
            if (keyboardOpen.get() && event.progress === 1 && event.height > 0) return
            if (interactive.get()) return
            if (event.height > 0) lift.set(Math.max(0, event.height - bottomOffset))
            opening.set(event.progress > 0)
            wasAtEnd.set(atEnd.get())
            offsetAtStart.set(scrollY.get())
            offsetY.set(scrollY.get())
            runOnJS(setScrollProcessing)(false)
        },
        onInteractive: (event) => {
            'worklet'
            if (!enabled) return
            if (!animating.get()) runOnJS(setScrollProcessing)(false)
            animating.set(true)
            interactive.set(true)
            // iOS keeps the inset under the finger; Android's list grows back as it goes.
            if (!isIos) keyboardInset.set(Math.max(0, event.height - bottomOffset))
        },
        onMove: (event) => {
            'worklet'
            if (!enabled || interactive.get() || !animating.get()) return
            const isOpening = opening.get()
            const progress = isOpening ? event.progress : 1 - event.progress
            const delta = lift.get() * progress
            offsetY.set(Math.max(0, offsetAtStart.get() + (isOpening ? delta : -delta)))
            keyboardInset.set(Math.max(0, event.height - bottomOffset))
        },
        onEnd: (event) => {
            'worklet'
            if (!enabled || !animating.get()) return
            if (!interactive.get()) {
                const isOpening = opening.get()
                const progress = isOpening ? event.progress : 1 - event.progress
                const delta = lift.get() * progress
                offsetY.set(Math.max(0, offsetAtStart.get() + (isOpening ? delta : -delta)))
            }
            const inset = Math.max(0, event.height - bottomOffset)
            keyboardInset.set(inset)
            // Closed: hand the offset back to the list where the drag left it.
            if (inset === 0) offsetY.set(scrollY.get())
            const settle = !interactive.get() && wasAtEnd.get()
            keyboardOpen.set(event.height > 0)
            interactive.set(false)
            wasAtEnd.set(false)
            animating.set(false)
            runOnJS(setScrollProcessing)(true)
            // Rows added meanwhile (the message just sent) aren't in the lift.
            if (settle) runOnJS(snapToEnd)(true)
        },
    }, [enabled, bottomOffset])

    const animatedProps = useAnimatedProps(() => {
        // No offset until the keyboard has moved: LegendList owns the initial one.
        const y = offsetY.get()
        const props: Record<string, unknown> = {}
        if (y !== null) props.contentOffset = { x: 0, y }
        if (isIos) props.contentInset = { top: 0, left: 0, right: 0, bottom: keyboardInset.get() }
        return props
    })

    const animatedStyle = useAnimatedStyle(() => (isIos ? {} : { marginBottom: keyboardInset.get() }))

    return {
        animatedProps: enabled ? animatedProps : undefined,
        animatedStyle: enabled && !isIos ? animatedStyle : undefined,
    }
}
