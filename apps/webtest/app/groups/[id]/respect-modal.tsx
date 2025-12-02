'use client'

// RespectModal - Modal shown on first respect click
// Explains the "close friends" feature
// Uses simple custom modal with existing CSS classes

import { HeartHandshake, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RespectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RespectModal({ isOpen, onClose }: RespectModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Handle open/close animations
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    
    if (isOpen) {
      setIsVisible(true)
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      // Wait for animation to complete before hiding
      timer = setTimeout(() => {
        setIsVisible(false)
      }, 200) // Match transition duration
    }
    
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isOpen])
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`modal__backdrop backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className={`modal__content transition-all duration-200 ${
          isAnimating 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="respect-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
            <HeartHandshake className="w-6 h-6 text-accent-foreground" />
          </div>
        </div>
        
        {/* Header */}
        <h2 id="respect-modal-title" className="modal__header text-center">
          Well done!
        </h2>
        
        {/* Body */}
        <p className="modal__body text-center">
          When you hit 3 mutual respects, you can become &quot;close friends&quot; with the other user and see each other&apos;s real names
        </p>
        
        {/* Footer */}
        <div className="modal__footer justify-center">
          <button 
            className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium transition-colors cursor-pointer active:scale-[0.98]"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </>
  )
}

