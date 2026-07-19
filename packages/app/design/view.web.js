import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { cn } from 'app/lib/util'

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

const isEditableKeyTarget = (target) => {
    if (!target || typeof target.closest !== 'function') return false
    return !!target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""]'
    )
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
        accessibilityDisabled,
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
        onKeyDown,
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
        keyboardAwareBottomOffset,
        pointerEvents,
        style,
        disabled,
        ...domProps
    } = props || {}

    if (accessibilityRole && !domProps.role) domProps.role = accessibilityRole
    if (accessibilityLabel && !domProps['aria-label']) domProps['aria-label'] = accessibilityLabel
    if (onPress) {
        if (!domProps.onClick && !disabled) domProps.onClick = onPress
        if (!domProps.role) domProps.role = 'button'
        if (domProps.tabIndex == null) domProps.tabIndex = disabled ? -1 : 0
        if (disabled && domProps['aria-disabled'] == null) domProps['aria-disabled'] = true
        domProps.onKeyDown = (event) => {
            onKeyDown?.(event)
            if (disabled || event.defaultPrevented) return
            if (isEditableKeyTarget(event.target)) return
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onPress(event)
            }
        }
    } else if (onKeyDown) {
        domProps.onKeyDown = onKeyDown
    }
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

/** Motion-style props consumed by the web CSS transition shim. */
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

const toCssDuration = (transition) => {
    const duration = transition?.duration ?? transition?.default?.duration
    if (typeof duration !== 'number') return '120ms'
    return `${duration > 10 ? duration : duration * 1000}ms`
}

const getAnimatedWebStyle = (motionProps) => {
    const animate = motionProps?.animate || {}
    const transform = []
    const style = {
        transitionProperty: 'transform, opacity',
        transitionDuration: toCssDuration(motionProps?.transition),
        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    }

    if (animate.opacity !== undefined) {
        style.opacity = animate.opacity
    }
    if (animate.scale !== undefined) {
        transform.push(`scale(${animate.scale})`)
    }
    if (animate.x !== undefined) {
        transform.push(`translateX(${typeof animate.x === 'number' ? `${animate.x}px` : animate.x})`)
    }
    if (animate.y !== undefined) {
        transform.push(`translateY(${typeof animate.y === 'number' ? `${animate.y}px` : animate.y})`)
    }
    if (animate.rotate !== undefined) {
        transform.push(`rotate(${typeof animate.rotate === 'number' ? `${animate.rotate}deg` : animate.rotate})`)
    }

    if (transform.length) {
        style.transform = transform.join(' ')
    }

    return style
}

export const interopComponent = (Component, displayName, baseClassName = 'neo-v') => {
    /** @type {any} */
    const Base = forwardRef(({ className, onLayout, ...props }, ref) => {
        const layoutRef = useWebLayout(ref, onLayout)

        return (
            <Component ref={layoutRef} className={cn(baseClassName, className)} {...sanitizeWebProps(props)} />
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

/** Plain left-click only — let cmd/ctrl/shift/middle clicks reach the browser. */
const isPlainLeftClick = (event) =>
    event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

export const Pressable = interopRender(
    'Pressable',
    ({ className, onLayout, onPress, href, target, rel, ...props }, ref) => {
        const layoutRef = useWebLayout(ref, onLayout)
        const hasCursorClass =
            typeof className === 'string' && /(?:^|\s)(?:web:)?cursor-/.test(className)

        // With href, render a real anchor: status-bar URL preview, open-in-new-tab
        // and SEO semantics. onPress still handles plain left-clicks (SPA nav).
        if (href) {
            const domProps = sanitizeWebProps(props)
            const handleClick = (event) => {
                if (!onPress || event.defaultPrevented || !isPlainLeftClick(event)) return
                event.preventDefault()
                onPress(event)
            }

            return (
                <a
                    ref={layoutRef}
                    href={href}
                    target={target}
                    rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
                    className={cn('neo-p', className)}
                    {...domProps}
                    onClick={handleClick}
                />
            )
        }

        return (
            <div
                ref={layoutRef}
                className={cn('neo-p', onPress && !hasCursorClass && 'web:cursor-pointer', className)}
                {...sanitizeWebProps({ ...props, onPress })}
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
            contentContainerClassName,
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
            horizontal ? 'neo-sh' : 'neo-sv',
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
                    className={cn(horizontal ? 'neo-sh-c' : 'neo-sv-c', contentContainerClassName)}
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
        const animatedStyle = getAnimatedWebStyle(motionProps)
        return (
            <div
                ref={layoutRef}
                className={cn('neo-v', className)}
                {...domProps}
                style={{
                    ...domProps.style,
                    ...motionStyle,
                    ...animatedStyle,
                }}
            >
                {children}
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
                className={cn('neo-v flex-row', className)}
                {...sanitizeWebProps(props)}
            >
                {children}
            </div>
        )
    }
)
