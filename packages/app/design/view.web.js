import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { cn } from 'app/lib/util'
import { Motion } from '@legendapp/motion'

const assignRef = (ref, value) => {
    if (typeof ref === 'function') {
        ref(value)
        return
    }

    if (ref) ref.current = value
}

const createLayoutEvent = (node) => {
    const rect = node.getBoundingClientRect()

    return {
        nativeEvent: {
            layout: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
            },
        },
    }
}

const useWebLayout = (forwardedRef, onLayout) => {
    const nodeRef = useRef(null)
    const lastLayoutRef = useRef(null)

    const setRef = useCallback((node) => {
        nodeRef.current = node
        assignRef(forwardedRef, node)
    }, [forwardedRef])

    useEffect(() => {
        const node = nodeRef.current
        if (!node || !onLayout) return

        const emitLayout = () => {
            const event = createLayoutEvent(node)
            const nextLayout = event.nativeEvent.layout
            const prevLayout = lastLayoutRef.current

            if (
                prevLayout &&
                prevLayout.x === nextLayout.x &&
                prevLayout.y === nextLayout.y &&
                prevLayout.width === nextLayout.width &&
                prevLayout.height === nextLayout.height
            ) {
                return
            }

            lastLayoutRef.current = nextLayout
            onLayout(event)
        }

        emitLayout()

        const observer = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(emitLayout)
            : null

        observer?.observe(node)
        window.addEventListener('resize', emitLayout)

        return () => {
            observer?.disconnect()
            window.removeEventListener('resize', emitLayout)
        }
    }, [onLayout])

    return setRef
}

const normalizeWebStyle = (style) => {
    if (!Array.isArray(style)) return style || undefined
    return Object.assign({}, ...style.filter(Boolean))
}

const displayUtilityPattern = /^(web:)?(hidden|block|inline-block|inline|flex|inline-flex|grid|inline-grid)$/
const nonFlexDisplayUtilityPattern = /^(web:)?(hidden|block|inline-block|inline|grid|inline-grid)$/
const flexDirectionUtilityPattern = /^(web:)?(flex-row|flex-row-reverse|flex-col|flex-col-reverse)$/
const flexDisplayUtilityPattern = /^(web:)?(flex|inline-flex)$/

const positionUtilityPattern = /^(web:)?(absolute|fixed|relative|static|sticky)$/
const getBaseClassName = (className, baseClassName) => {
    const isFlexColumnPreset =
        baseClassName === 'flex flex-col' || baseClassName === 'flex flex-col relative'
    if (!isFlexColumnPreset) return baseClassName
    const tokens = typeof className === 'string' ? className.split(/\s+/).filter(Boolean) : []
    const hasDisplay = tokens.some((token) => displayUtilityPattern.test(token))
    const hasNonFlexDisplay = tokens.some((token) => nonFlexDisplayUtilityPattern.test(token))
    const hasDirection = tokens.some((token) => flexDirectionUtilityPattern.test(token))
    const hasFlexDisplay = tokens.some((token) => flexDisplayUtilityPattern.test(token))
    const hasAbsoluteOrFixed = tokens.some((token) => /^(web:)?(absolute|fixed)$/.test(token))
    const hasAnyPosition = tokens.some((token) => positionUtilityPattern.test(token))
    const defaults = []
    if (!hasDisplay) defaults.push('flex')
    if (!hasNonFlexDisplay && !hasDirection && (!hasDisplay || hasFlexDisplay)) {
        defaults.push('flex-col')
    }
    // relative only when position is not explicitly set
    if (baseClassName.includes('relative') && !hasAbsoluteOrFixed && !hasAnyPosition) {
        defaults.push('relative')
    }
    return defaults.join(' ')
}

const sanitizeWebProps = (props) => {
    const {
        accessibilityRole,
        accessibilityLabel,
        accessibilityHint,
        accessibilityElementsHidden,
        accessibilityViewIsModal,
        accessibilityLiveRegion,
        accessibilityState,
        accessibilityValue,
        accessibilityActions,
        importantForAccessibility,
        accessible,
        collapsable,
        focusable,
        hitSlop,
        horizontal,
        showsHorizontalScrollIndicator,
        showsVerticalScrollIndicator,
        scrollEventThrottle,
        contentContainerStyle,
        endFillColor,
        bounces,
        alwaysBounceHorizontal,
        alwaysBounceVertical,
        directionalLockEnabled,
        nestedScrollEnabled,
        overScrollMode,
        pagingEnabled,
        snapToAlignment,
        snapToEnd,
        snapToInterval,
        snapToOffsets,
        snapToStart,
        decelerationRate,
        keyboardDismissMode,
        keyboardShouldPersistTaps,
        scrollEnabled,
        nativeID,
        onLayout,
        onPress,
        onPressIn,
        onPressOut,
        onLongPress,
        onScroll,
        onAccessibilityAction,
        onStartShouldSetResponder,
        onStartShouldSetResponderCapture,
        onMoveShouldSetResponder,
        onMoveShouldSetResponderCapture,
        onResponderGrant,
        onResponderReject,
        onResponderMove,
        onResponderRelease,
        onResponderStart,
        onResponderEnd,
        onResponderTerminate,
        onResponderTerminationRequest,
        onShouldBlockNativeResponder,
        pointerEvents,
        style,
        ...domProps
    } = props || {}

    if (accessibilityRole && !domProps.role) domProps.role = accessibilityRole
    if (accessibilityLabel && !domProps['aria-label']) domProps['aria-label'] = accessibilityLabel
    if (onPress && !domProps.onClick) domProps.onClick = onPress
    if (nativeID && !domProps.id) domProps.id = nativeID

    const webStyle = normalizeWebStyle(style)
    if (pointerEvents || webStyle) {
        domProps.style = {
            ...webStyle,
            ...(pointerEvents ? { pointerEvents } : null),
        }
    }

    return domProps
}

/** Props consumed by @legendapp/motion — must not land on the outer DOM wrapper */
const MOTION_PROP_KEYS = new Set([
    'animate',
    'animateProps',
    'initial',
    'initialProps',
    'exit',
    'transition',
    'transformOrigin',
    'whileTap',
    'whileHover',
    'onAnimationComplete',
])

const splitMotionProps = (props) => {
    const motion = {}
    const rest = {}
    for (const key of Object.keys(props)) {
        if (MOTION_PROP_KEYS.has(key)) motion[key] = props[key]
        else rest[key] = props[key]
    }
    return [motion, rest]
}

export const interopComponent = (Component, displayName, baseClassName = 'flex flex-col relative') => {
    /** @type {any} */
    const Base = forwardRef(({ className, onLayout, ...props }, ref) => {
        const layoutRef = useWebLayout(ref, onLayout)

        return (
            <Component ref={layoutRef} className={cn(getBaseClassName(className, baseClassName), className)} {...sanitizeWebProps(props)} />
        )
    })
    Base.displayName = displayName
    return Base
}

export const interopRender = (displayName, render) => {
    /** @type {any} */
    const Base = forwardRef(render)
    Base.displayName = displayName
    return Base
}

export const View = interopComponent('div', 'View')
export const Pressable = interopRender(
    'Pressable',
    ({ className, onLayout, ...props }, ref) => {
        const layoutRef = useWebLayout(ref, onLayout)

        return (
            <div
                ref={layoutRef}
                className={cn(getBaseClassName(className, 'flex flex-col'), 'cursor-pointer', className)}
                {...sanitizeWebProps(props)}
            />
        )
    }
)
export const ScrollView = interopRender(
    'ScrollView',
    (
        {
            children,
            className,
            onLayout,
            horizontal,
            contentContainerStyle,
            scrollEnabled = true,
            onScroll,
            ...rest
        },
        ref
    ) => {
        const layoutRef = useWebLayout(ref, onLayout)
        const domProps = sanitizeWebProps(rest)
        const innerStyle = normalizeWebStyle(contentContainerStyle)
        const outerClass = cn(
            horizontal
                ? 'flex min-w-0 flex-row flex-nowrap overflow-x-auto overflow-y-hidden'
                : 'flex min-h-0 flex-col overflow-x-hidden overflow-y-auto',
            scrollEnabled === false && 'overflow-hidden',
            className
        )
        return (
            <div
                ref={layoutRef}
                className={outerClass}
                onScroll={onScroll}
                {...domProps}
            >
                <div
                    className={
                        horizontal
                            ? 'flex min-h-0 flex-row flex-nowrap'
                            : 'flex min-w-0 flex-col'
                    }
                    style={innerStyle}
                >
                    {children}
                </div>
            </div>
        )
    }
)
export const MotionView = interopRender(
    'MotionView',
    ({ className, onLayout, style, children, ...props }, ref) => {
        const layoutRef = useWebLayout(ref, onLayout)
        const [motionProps, restProps] = splitMotionProps(props)
        const domProps = sanitizeWebProps(restProps)
        const motionStyle = normalizeWebStyle(style)
        return (
            <div
                ref={layoutRef}
                className={cn(getBaseClassName(className, 'flex flex-col relative'), className)}
                {...domProps}
            >
                <Motion.View
                    style={[
                        { flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch' },
                        motionStyle,
                    ]}
                    {...motionProps}
                >
                    {children}
                </Motion.View>
            </div>
        )
    }
)

export const Row = interopRender(
    'Row',
    ({ children, className, onLayout, ...props }, ref) => {
        const layoutRef = useWebLayout(ref, onLayout)

        return (
            <div
                ref={layoutRef}
                className={cn('flex flex-row', className)}
                {...sanitizeWebProps(props)}
            >
                {children}
            </div>
        )
    }
)
