"use client"

// GlassyButton - A button with live camera feed background
// Creates a unique reflection/mirror effect

import { useRef, useEffect, useState, useCallback } from "react"
import { glassyButtonClasses, type GlassyButtonProps } from "./types"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

/**
 * GlassyButton - A button with live camera video as background
 * 
 * Creates a "reflection" effect by showing the user's camera feed
 * behind a semi-transparent glass overlay.
 * 
 * @example
 * ```tsx
 * <GlassyButton>Click Me</GlassyButton>
 * <GlassyButton variant="primary" blur="sm">Primary</GlassyButton>
 * <GlassyButton variant="dark" mirror={false}>Dark Mode</GlassyButton>
 * ```
 */
export function GlassyButton({
  children,
  variant = "default",
  size = "md",
  isDisabled = false,
  isPending = false,
  isIconOnly = false,
  className,
  onClick,
  type = "button",
  mirror = true,
  blur = "sm",
  overlayOpacity = 0.3,
  ...props
}: GlassyButtonProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (streamRef.current) return // Already have a stream
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 180 },
          facingMode: "user",
        },
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setHasCamera(true)
      }
    } catch (err) {
      console.warn("GlassyButton: Camera access denied or unavailable")
      setHasCamera(false)
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setHasCamera(false)
  }, [])

  // Start camera on hover for better performance
  useEffect(() => {
    if (isHovered && !isDisabled) {
      startCamera()
    }
    // Don't stop on unhover - keep running for smoother UX
  }, [isHovered, isDisabled, startCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Build BEM class string
  const bemClasses = cn(
    glassyButtonClasses.base,
    glassyButtonClasses.sizes[size],
    glassyButtonClasses.variants[variant],
    isIconOnly && glassyButtonClasses.iconOnly,
    blur !== "none" && `glassy-button--blur-${blur}`,
    hasCamera && "glassy-button--camera-active"
  )

  const combinedClassName = cn(bemClasses, className)

  // Calculate blur value - more distinct steps
  const blurValue = blur === "none" ? 0 : blur === "sm" ? 2 : blur === "md" ? 12 : 24

  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={isDisabled || isPending}
      aria-disabled={isDisabled || isPending || undefined}
      data-disabled={isDisabled || undefined}
      data-pending={isPending || undefined}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      style={{
        "--glassy-overlay-opacity": overlayOpacity,
        "--glassy-blur": `${blurValue}px`,
      } as React.CSSProperties}
      {...props}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        className="glassy-button__video"
        autoPlay
        playsInline
        muted
        style={{
          transform: mirror ? "scaleX(-1)" : undefined,
        }}
      />
      
      {/* Glass overlay */}
      <span className="glassy-button__overlay" />
      
      {/* Content */}
      <span className="glassy-button__content">
        {children}
      </span>
    </button>
  )
}
