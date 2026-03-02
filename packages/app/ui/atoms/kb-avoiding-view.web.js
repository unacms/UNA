import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, ScrollView } from 'app/design/view'

function isEditableTarget(target) {
    if (!target) return false
    const tagName = target.tagName?.toLowerCase?.()
    return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable === true
    )
}

function mergeRef(ref, value) {
    if (!ref) return
    if (typeof ref === 'function') {
        ref(value)
        return
    }
    ref.current = value
}

function useWebKeyboardInset() {
    const hostRef = useRef(null)
    const baselineHeightRef = useRef(0)
    const isFocusedRef = useRef(false)
    const [keyboardInset, setKeyboardInset] = useState(0)

    const getViewportHeight = useCallback(() => {
        if (typeof window === 'undefined') return 0
        if (window.visualViewport) {
            return Math.round(
                window.visualViewport.height + window.visualViewport.offsetTop,
            )
        }
        return Math.round(window.innerHeight || 0)
    }, [])

    const updateInset = useCallback(() => {
        const viewportHeight = getViewportHeight()
        if (!viewportHeight) return

        if (!isFocusedRef.current) {
            baselineHeightRef.current = Math.max(
                baselineHeightRef.current,
                viewportHeight,
            )
            setKeyboardInset((prev) => (prev === 0 ? prev : 0))
            return
        }

        if (!baselineHeightRef.current) {
            baselineHeightRef.current = viewportHeight
        }

        const nextInset = Math.max(
            0,
            baselineHeightRef.current - viewportHeight,
        )
        setKeyboardInset((prev) => (prev === nextInset ? prev : nextInset))
    }, [getViewportHeight])

    useEffect(() => {
        if (typeof window === 'undefined') return

        updateInset()

        const viewport = window.visualViewport
        viewport?.addEventListener('resize', updateInset)
        viewport?.addEventListener('scroll', updateInset)
        window.addEventListener('resize', updateInset)

        return () => {
            viewport?.removeEventListener('resize', updateInset)
            viewport?.removeEventListener('scroll', updateInset)
            window.removeEventListener('resize', updateInset)
        }
    }, [updateInset])

    const onFocusCapture = useCallback(
        (event) => {
            if (!isEditableTarget(event?.target)) return
            isFocusedRef.current = true
            updateInset()
        },
        [updateInset],
    )

    const onBlurCapture = useCallback(() => {
        setTimeout(() => {
            const activeElement =
                typeof document === 'undefined' ? null : document.activeElement
            if (hostRef.current?.contains(activeElement)) {
                return
            }
            isFocusedRef.current = false
            updateInset()
        }, 0)
    }, [updateInset])

    return {
        hostRef,
        keyboardInset,
        onFocusCapture,
        onBlurCapture,
    }
}

function resolveInset({
    keyboardInset,
    modalOffset,
    keyboardVerticalOffset,
}) {
    const offset =
        typeof modalOffset === 'number'
            ? modalOffset
            : typeof keyboardVerticalOffset === 'number'
                ? keyboardVerticalOffset
                : 0
    return Math.max(0, keyboardInset - offset)
}

export default function KbAvoidingView(props) {
    const {
        children,
        style,
        className,
        modalOffset,
        keyboardVerticalOffset,
        behavior,
        enabled,
        onFocusCapture,
        onBlurCapture,
        ...rest
    } = props
    const keyboard = useWebKeyboardInset()
    const inset = resolveInset({
        keyboardInset: keyboard.keyboardInset,
        modalOffset,
        keyboardVerticalOffset,
    })

    const containerStyle = useMemo(() => {
        const insetStyle = inset > 0 ? { paddingBottom: inset } : null
        if (style && insetStyle) return [style, insetStyle]
        return style || insetStyle || undefined
    }, [inset, style])

    const handleFocusCapture = useCallback(
        (event) => {
            onFocusCapture?.(event)
            keyboard.onFocusCapture(event)
        },
        [onFocusCapture, keyboard],
    )

    const handleBlurCapture = useCallback(
        (event) => {
            onBlurCapture?.(event)
            keyboard.onBlurCapture(event)
        },
        [onBlurCapture, keyboard],
    )

    return (
        <View
            {...rest}
            ref={keyboard.hostRef}
            className={className}
            style={containerStyle}
            onFocusCapture={handleFocusCapture}
            onBlurCapture={handleBlurCapture}
        >
            {children}
        </View>
    )
}

export const KbAvoidingViewScroll = React.forwardRef((props, ref) => {
    const {
        children,
        className,
        contentContainerStyle,
        modalOffset,
        keyboardVerticalOffset,
        behavior,
        enabled,
        onFocusCapture,
        onBlurCapture,
        ...rest
    } = props
    const keyboard = useWebKeyboardInset()
    const inset = resolveInset({
        keyboardInset: keyboard.keyboardInset,
        modalOffset,
        keyboardVerticalOffset,
    })

    const mergedContentStyle = useMemo(() => {
        const insetStyle = inset > 0 ? { paddingBottom: inset } : null
        if (contentContainerStyle && insetStyle) {
            return [contentContainerStyle, insetStyle]
        }
        return contentContainerStyle || insetStyle || undefined
    }, [contentContainerStyle, inset])

    const setHostRef = useCallback(
        (node) => {
            keyboard.hostRef.current = node
            mergeRef(ref, node)
        },
        [keyboard.hostRef, ref],
    )

    const handleFocusCapture = useCallback(
        (event) => {
            onFocusCapture?.(event)
            keyboard.onFocusCapture(event)
        },
        [onFocusCapture, keyboard],
    )

    const handleBlurCapture = useCallback(
        (event) => {
            onBlurCapture?.(event)
            keyboard.onBlurCapture(event)
        },
        [onBlurCapture, keyboard],
    )

    return (
        <ScrollView
            {...rest}
            ref={setHostRef}
            className={className}
            contentContainerStyle={mergedContentStyle}
            onFocusCapture={handleFocusCapture}
            onBlurCapture={handleBlurCapture}
        >
            {children}
        </ScrollView>
    )
})
