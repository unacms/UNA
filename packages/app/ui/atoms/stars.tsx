'use client'

import { useCallback, useRef, useState, type Ref } from 'react'
import type { TFunction } from 'i18next'
import type { ViewStyle } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Row, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { cn, FeedbackHaptics, isWeb } from 'app/lib/util'

const DEFAULT_MAX = 5
const DEFAULT_STAR_SIZE = 22
const DEFAULT_HIT = 40

function clampRating(value: unknown, maxStars: number): number {
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) return 0
    return Math.min(maxStars, Math.round(n))
}

function starCountLabel(t: TFunction, count: number): string {
    return count === 1 ? t('1 star') : t('{{count}} stars', { count })
}

function StarGlyph({ filled, size }: { filled: boolean; size: number }) {
    return (
        <View className="relative items-center justify-center" style={{ width: size, height: size }}>
            <Icon
                icon="Star"
                size={size}
                fill="none"
                className="text-muted-foreground"
            />
            <View
                className={cn(
                    'absolute inset-0 items-center justify-center web:transition-opacity web:duration-150 web:ease-out',
                    filled ? 'opacity-100' : 'opacity-0',
                )}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                <Icon
                    icon="Star"
                    size={size}
                    fill="currentColor"
                    className="text-amber-500"
                />
            </View>
        </View>
    )
}

function StarButton({
    value,
    filled,
    checked,
    disabled,
    starSize,
    hitSize,
    starStyle,
    label,
    tabIndex,
    onSelect,
    onHover,
    onKeyDown,
    buttonRef,
}: {
    value: number
    filled: boolean
    checked: boolean
    disabled?: boolean
    starSize: number
    hitSize: number
    starStyle?: ViewStyle
    label: string
    tabIndex: 0 | -1
    onSelect: (value: number) => void
    onHover?: (value: number) => void
    onKeyDown?: (event: { key?: string; preventDefault?: () => void }) => void
    buttonRef?: Ref<any>
}) {
    return (
        <Pressable
            ref={buttonRef}
            accessibilityRole="radio"
            accessibilityState={{ selected: checked, disabled: !!disabled }}
            accessibilityLabel={label}
            aria-checked={checked}
            disabled={disabled}
            onPress={() => onSelect(value)}
            onKeyDown={isWeb ? onKeyDown : undefined}
            onMouseEnter={isWeb && !disabled ? () => onHover?.(value) : undefined}
            onMouseLeave={isWeb && !disabled ? () => onHover?.(0) : undefined}
            tabIndex={tabIndex}
            className={cn(
                'shrink-0 items-center justify-center rounded-full',
                'web:cursor-pointer web:transition-transform web:duration-150 web:ease-out',
                'web:hover:bg-muted/50 web:active:scale-[0.96]',
                'web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring',
                disabled ? 'opacity-40' : '',
            )}
            style={
                isWeb
                    ? {
                        width: hitSize,
                        height: hitSize,
                        minWidth: hitSize,
                        minHeight: hitSize,
                        ...starStyle,
                    }
                    : ({ pressed }: { pressed: boolean }) => [
                        {
                            width: hitSize,
                            height: hitSize,
                            minWidth: hitSize,
                            minHeight: hitSize,
                        },
                        starStyle,
                        pressed && !disabled ? { transform: [{ scale: 0.96 }] } : null,
                    ]
            }
        >
            <StarGlyph filled={filled} size={starSize} />
        </Pressable>
    )
}

type StarsViewProps = {
    rating?: number | string | null
    starSize?: number
    className?: string
    starStyle?: ViewStyle
}

export function StarsView({ rating, starSize = 20, className, starStyle: _starStyle }: StarsViewProps) {
    const { t } = useTranslation()
    const label = rating == null || rating === '' ? '' : String(rating)
    if (!label) return null

    return (
        <Row
            className={cn('items-center gap-1', className)}
            accessibilityRole="text"
            accessibilityLabel={starCountLabel(t, Number(rating) || 0)}
        >
            <StarGlyph filled size={starSize} />
            <Text className="font-semibold text-base text-card-foreground">{label}</Text>
        </Row>
    )
}

type StarsActionProps = {
    rating?: number | string
    /** Omit (or disable) for a read-only row. Pressing the current value clears to 0. */
    onChange?: (rating: number) => void
    maxStars?: number
    starSize?: number
    /** Touch target; defaults to starSize + 16 (min 40). */
    hitSize?: number
    starStyle?: ViewStyle
    disabled?: boolean
    /** Legacy, ignored. */
    color?: string
    /** Legacy, ignored. */
    enableHalfStar?: boolean
}

export function StarsAction({
    rating = 0,
    onChange,
    maxStars = DEFAULT_MAX,
    starSize = DEFAULT_STAR_SIZE,
    hitSize,
    starStyle,
    disabled,
    color: _color,
    enableHalfStar: _enableHalfStar,
}: StarsActionProps) {
    const { t } = useTranslation()
    const count = Math.max(1, Number(maxStars) || DEFAULT_MAX)
    const value = clampRating(rating, count)
    const [hoverValue, setHoverValue] = useState(0)
    const buttonRefs = useRef<({ focus?: () => void } | null)[]>([])
    const targetSize = hitSize ?? Math.max(DEFAULT_HIT, (Number(starSize) || DEFAULT_STAR_SIZE) + 16)
    const preview = hoverValue > 0 ? hoverValue : value
    const readOnly = disabled || typeof onChange !== 'function'

    const commit = useCallback((next: number) => {
        if (readOnly) return
        const resolved = next === value ? 0 : next
        FeedbackHaptics('Select')
        onChange(resolved)
    }, [onChange, readOnly, value])

    const focusStar = useCallback((index: number) => {
        const node = buttonRefs.current[index]
        node?.focus?.()
    }, [])

    const onGroupKeyDown = useCallback((event: { key?: string; preventDefault?: () => void }) => {
        if (readOnly || !isWeb) return
        const key = event?.key
        let next = value
        if (key === 'ArrowRight' || key === 'ArrowUp') next = Math.min(count, (value || 0) + 1)
        else if (key === 'ArrowLeft' || key === 'ArrowDown') next = Math.max(1, value === 0 ? 1 : value - 1)
        else if (key === 'Home') next = 1
        else if (key === 'End') next = count
        else return
        event.preventDefault?.()
        if (next === value) return
        FeedbackHaptics('Select')
        onChange(next)
        focusStar(next - 1)
    }, [count, focusStar, onChange, readOnly, value])

    const stars = []
    for (let i = 1; i <= count; i += 1) {
        const checked = value === i
        const tabStop = value > 0 ? checked : i === 1
        stars.push(
            <StarButton
                key={i}
                value={i}
                filled={i <= preview}
                checked={checked}
                disabled={readOnly}
                starSize={starSize}
                hitSize={targetSize}
                starStyle={starStyle}
                label={starCountLabel(t, i)}
                tabIndex={tabStop ? 0 : -1}
                onSelect={commit}
                onHover={setHoverValue}
                onKeyDown={onGroupKeyDown}
                buttonRef={(node) => {
                    buttonRefs.current[i - 1] = node
                }}
            />
        )
    }

    return (
        <Row
            accessibilityRole="radiogroup"
            accessibilityLabel={t('Star rating')}
            className="items-center"
            onMouseLeave={isWeb ? () => setHoverValue(0) : undefined}
        >
            {stars}
        </Row>
    )
}
