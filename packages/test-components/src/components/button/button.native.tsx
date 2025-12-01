// Button - Native Implementation (Expo + Uniwind)
// Uses Pressable for native touch handling

import { Pressable, Text, ActivityIndicator } from 'react-native'
import type { ButtonProps } from './types'
import { buttonBase, buttonVariants, buttonSizes } from './types'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  onPress,
}: ButtonProps) {
  // Extract text color from variant for the Text component
  const textColorClass = buttonVariants[variant].split(' ').find(c => c.startsWith('text-')) || 'text-foreground'
  
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        // Native-specific: active state styling
        'active:opacity-80',
        disabled && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color="currentColor"
          className="mr-2"
        />
      ) : null}
      <Text className={cn(textColorClass, 'font-medium')}>
        {typeof children === 'string' ? children : null}
      </Text>
    </Pressable>
  )
}


