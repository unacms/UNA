import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, type ComponentType, type CSSProperties, type ForwardRefRenderFunction, type MouseEvent as ReactMouseEvent, type Ref } from 'react'
import { cn } from 'app/lib/util'
import type {
    DesignMotionViewProps,
    DesignPressableProps,
    DesignScrollViewProps,
    DesignViewProps,
} from './view.types'

type Layout = { x: number; y: number; width: number; height: number }
type LayoutEvent = { nativeEvent: { layout: Layout } }

const assignRef = (ref: Ref<any> | undefined, value: any) => {
    if (typeof ref === 'function') {
        ref(value)
        return
    }

    if (ref) (ref as { current: any }).current = value
}

const createLayoutEvent = (node: Element): LayoutEvent => {
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

const useWebLayout = (forwardedRef: Ref<any> | undefined, onLayout?: (event: LayoutEvent) => void) => {
    const nodeRef = useRef<Element | null>(null)
    const lastLayoutRef = useRef<Layout | null>(null)
    const emitLayoutRef = useRef<(() => void) | null>(null)
    // Latest callback lives in a ref so the subscription below is created once per
    // mount instead of on every render (call sites pass inline arrows). Re-running
    // it per render is wasted work, and on a fiber that still holds a low-priority
    // update (idle hydration of the page Suspense boundary) the re-emitted
    // setState cannot bail out and keeps the render loop alive.
    const onLayoutRef = useRef(onLayout)
    useLayoutEffect(() => {
        onLayoutRef.current = onLayout
    })
    const hasOnLayout = typeof onLayout === 'function'

    const setRef = useCallback((node: Element | null) => {
        nodeRef.current = node
        assignRef(forwardedRef, node)
    }, [forwardedRef])

    useEffect(() => {
        const node = nodeRef.current
        if (!node || !hasOnLayout) return

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
            onLayoutRef.current?.(event)
        }

        emitLayoutRef.current = emitLayout
        emitLayout()

        const observer = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(emitLayout)
            : null

        observer?.observe(node)
        window.addEventListener('resize', emitLayout)

        return () => {
            emitLayoutRef.current = null
            observer?.disconnect()
            window.removeEventListener('resize', emitLayout)
        }
    }, [hasOnLayout])

    // ResizeObserver misses pure position changes (x/y). Re-measure after every
    // render, as the old per-render resubscribe did; emitLayout only calls
    // onLayout when the rect actually changed.
    useEffect(() => {
        emitLayoutRef.current?.()
    })

    return setRef
}

const normalizeWebStyle = (style: any): CSSProperties | undefined => {
    if (!Array.isArray(style)) return style || undefined
    return Object.assign({}, ...style.filter(Boolean))
}

const isEditableKeyTarget = (target: any) => {
    if (!target || typeof target.closest !== 'function') return false
    return !!target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""]'
    )
}

const sanitizeWebProps = (props: Record<string, any>): Record<string, any> => {
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
        extraData,
        onScrollBeginDrag,
        onScrollEndDrag,
        onMomentumScrollBegin,
        onMomentumScrollEnd,
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
        domProps.onKeyDown = (event: any) => {
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

const splitMotionProps = (props: Record<string, any>): [Record<string, any>, Record<string, any>] => {
    const motion: Record<string, any> = {}
    const rest: Record<string, any> = {}
    for (const key of Object.keys(props)) {
        if (MOTION_PROP_KEYS.has(key)) motion[key] = props[key]
        else rest[key] = props[key]
    }
    return [motion, rest]
}

const toCssDuration = (transition: any) => {
    const duration = transition?.duration ?? transition?.default?.duration
    if (typeof duration !== 'number') return '120ms'
    return `${duration > 10 ? duration : duration * 1000}ms`
}

const getAnimatedWebStyle = (motionProps: any): CSSProperties => {
    const animate = motionProps?.animate || {}
    const transform: string[] = []
    const style: CSSProperties = {
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

export const interopComponent = (Component: any, displayName: string, baseClassName = 'neo-v'): any => {
    const Base: any = forwardRef(({ className, onLayout, ...props }: any, ref) => {
        const layoutRef = useWebLayout(ref, onLayout)

        return (
            <Component ref={layoutRef} className={cn(baseClassName, className)} {...sanitizeWebProps(props)} />
        )
    })
    Base.displayName = displayName
    return Base
}

export const interopRender = (displayName: string, render: ForwardRefRenderFunction<any, any>): any => {
    const Base: any = forwardRef(render)
    Base.displayName = displayName
    return Base
}

export const View: ComponentType<DesignViewProps> = interopComponent('div', 'View')

/** Plain left-click only — let cmd/ctrl/shift/middle clicks reach the browser. */
const isPlainLeftClick = (event: MouseEvent | ReactMouseEvent) =>
    event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

export const Pressable: ComponentType<DesignPressableProps> = interopRender(
    'Pressable',
    ({ className, onLayout, onPress, href, target, rel, ...props }: any, ref: any) => {
        const layoutRef = useWebLayout(ref, onLayout)
        const hasCursorClass =
            typeof className === 'string' && /(?:^|\s)(?:web:)?cursor-/.test(className)

        // With href, render a real anchor: status-bar URL preview, open-in-new-tab
        // and SEO semantics. onPress still handles plain left-clicks (SPA nav).
        if (href) {
            const domProps = sanitizeWebProps(props)
            const handleClick = (event: ReactMouseEvent) => {
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
export const ScrollView: ComponentType<DesignScrollViewProps> = interopRender(
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
        }: any,
        ref: any
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
export const MotionView: ComponentType<DesignMotionViewProps> = interopRender(
    'MotionView',
    ({ className, onLayout, style, children, ...props }: any, ref: any) => {
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

export const Row: ComponentType<DesignViewProps> = interopRender(
    'Row',
    ({ children, className, onLayout, ...props }: any, ref: any) => {
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
