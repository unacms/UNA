'use client'

// CreatePostModal - Modal for creating new posts
// Features: author selector, audience selector, text area, attachments, submit button
// Includes optional admin prompt popover for auto-triggered modals

import { 
  Image, 
  Paperclip, 
  Hash, 
  FileText,
  X, 
  Globe, 
  Users, 
  Lock,
  ChevronDown,
  Send,
  ShieldCheck,
  Ghost
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// User profile type
interface UserProfile {
  id: string
  name: string
  avatar?: string
  isProtected?: boolean
  isPlaceholder?: boolean
}

// Placeholder option for first-time posting
const placeholderProfile: UserProfile = {
  id: "placeholder",
  name: "Select identity...",
  isPlaceholder: true,
}

// Protected profile option
const protectedProfile: UserProfile = {
  id: "protected",
  name: "Protected Name",
  isProtected: true,
}

// Real name profile
const realNameProfile: UserProfile = {
  id: "tim-doe",
  name: "Tim Doe, MD. PhD.",
  avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
}

// Selectable profiles (excluding placeholder)
const selectableProfiles: UserProfile[] = [
  realNameProfile,
  protectedProfile,
]

// Track if user has posted before (persists in localStorage)
const HAS_POSTED_KEY = 'neo-webtest-has-posted'

function getHasPostedBefore(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(HAS_POSTED_KEY) === 'true'
}

function setHasPostedBefore(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HAS_POSTED_KEY, 'true')
  }
}

const audienceOptions = [
  { id: "public", label: "Public", icon: Globe, description: "Anyone can see this post" },
  { id: "friends", label: "Friends", icon: Users, description: "Only your friends can see" },
  { id: "private", label: "Only me", icon: Lock, description: "Only you can see this post" },
]

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (content: string, profile: UserProfile, audience: typeof audienceOptions[0]) => void
  /** If true, shows admin prompt popover above modal */
  showAdminPrompt?: boolean
  /** The prompt text from admin */
  adminPromptText?: string
}

export function CreatePostModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  showAdminPrompt = false,
  adminPromptText = "your weekly check-in"
}: CreatePostModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [_hasPostedBefore, setHasPostedBeforeState] = useState(false)
  // First time: show placeholder, subsequent: default to protected
  const [selectedProfile, setSelectedProfile] = useState<UserProfile>(placeholderProfile)
  const [selectedAudience, setSelectedAudience] = useState(audienceOptions[0]!)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Check if user has posted before on mount
  useEffect(() => {
    const posted = getHasPostedBefore()
    setHasPostedBeforeState(posted)
    // Set default profile based on posting history
    if (posted) {
      setSelectedProfile(protectedProfile)
    } else {
      setSelectedProfile(placeholderProfile)
    }
  }, [])
  
  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
      // Focus textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      // Show admin prompt popover with delay if enabled
      if (showAdminPrompt) {
        setTimeout(() => {
          setShowPopover(true)
        }, 400) // Delay to let modal animate in first
      }
    } else {
      setIsAnimating(false)
      setShowPopover(false)
      const timer = setTimeout(() => {
        setIsVisible(false)
        // Reset form when closing
        setPostContent('')
        setShowProfileDropdown(false)
        setShowAudienceDropdown(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, showAdminPrompt])
  
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
  
  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostContent(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px'
  }
  
  const handleSubmit = () => {
    // Require both content and identity selection
    if (!postContent.trim() || selectedProfile.isPlaceholder) return
    
    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(postContent, selectedProfile, selectedAudience)
    }
    
    // Mark that user has posted (for future default to protected)
    setHasPostedBefore()
    setHasPostedBeforeState(true)
    
    // Reset and close
    setPostContent('')
    onClose()
  }
  
  // Check if form is valid for submission
  const canSubmit = postContent.trim() && !selectedProfile.isPlaceholder

  if (!isVisible) return null

  const AudienceIcon = selectedAudience.icon

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-51 w-full max-w-xl transition-all duration-200 ${
          isAnimating 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-modal-title"
      >
        {/* Admin Prompt Popover - appears above modal */}
        {showAdminPrompt && (
          <div 
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 transition-all duration-300 ${
              showPopover 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="relative bg-accent text-accent-foreground px-4 py-3 rounded-xl shadow-lg max-w-xl mx-4">
              {/* Arrow pointing down */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-accent" />
              </div>
              
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-accent-foreground/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    The group admin has asked you to create a post on <strong>{adminPromptText}</strong>. Use protected name so nobody knows who you are.
                  </p>
                </div>
                <button 
                  onClick={() => setShowPopover(false)}
                  className="shrink-0 p-1 rounded hover:bg-accent-foreground/10 transition-colors cursor-pointer"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-card border border-border rounded-2xl shadow-2xl mx-4 overflow-hidden">
          {/* Header with selectors */}
          <div className="flex items-center gap-2 p-4 ">
            {/* Profile Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown)
                  setShowAudienceDropdown(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                  selectedProfile.isPlaceholder 
                    ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-600' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                {selectedProfile.isPlaceholder ? (
                  <div className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">?</span>
                  </div>
                ) : selectedProfile.isProtected ? (
                  <div className="w-6 h-6 rounded-full bg-accent border border-accent-foreground/20 flex items-center justify-center">
                    <Ghost className="w-4 h-4 text-accent-foreground" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={selectedProfile.avatar} 
                    alt={selectedProfile.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className={`text-sm font-medium truncate max-w-[150px] ${
                  selectedProfile.isPlaceholder ? 'text-primary' : ''
                }`}>{selectedProfile.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
              
              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-10 py-1">
                  {selectableProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfile(profile)
                        setShowProfileDropdown(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors cursor-pointer ${
                        selectedProfile.id === profile.id ? 'bg-muted/50' : ''
                      }`}
                    >
                      {profile.isProtected ? (
                        <div className="w-8 h-8 border border-accent-foreground/20 rounded-full bg-accent flex items-center justify-center">
                          <Ghost className="w-5 h-5 text-accent-foreground " />
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={profile.avatar} 
                          alt={profile.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div className="text-left">
                        <span className="text-sm font-medium">{profile.name}</span>
                        {profile.isProtected && (
                          <p className="text-xs text-muted-foreground">Real name protected</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Text Area */}
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={postContent}
              onChange={handleTextareaChange}
              placeholder="Write here..."
              className="w-full min-h-[150px] max-h-[300px] bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base"
            />
          </div>
          
          {/* Footer with attachments, audience selector, and submit */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            {/* Attachment Icons */}
            <div className="flex items-center gap-1">
              <button 
                className="p-2.5 rounded-full hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Add image"
              >
                <Image className="w-5 h-5" />
              </button>
              <button 
                className="p-2.5 rounded-full hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Add attachment"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                className="p-2.5 rounded-full hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Add hashtag"
              >
                <Hash className="w-5 h-5" />
              </button>
              <button 
                className="p-2.5 rounded-full hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Add poll"
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>
            
            {/* Audience Selector and Submit */}
            <div className="flex items-center gap-2">
              {/* Audience Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAudienceDropdown(!showAudienceDropdown)
                    setShowProfileDropdown(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <AudienceIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedAudience.label}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
                
                {/* Audience Dropdown - opens upward */}
                {showAudienceDropdown && (
                  <div className="absolute bottom-full right-0 mb-1 w-64 bg-card border border-border rounded-lg shadow-lg z-10 py-1">
                    {audienceOptions.map((option) => {
                      const OptionIcon = option.icon
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedAudience(option)
                            setShowAudienceDropdown(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors cursor-pointer ${
                            selectedAudience.id === option.id ? 'bg-muted/50' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <OptionIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all cursor-pointer active:scale-95 ${
                  canSubmit
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

