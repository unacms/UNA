'use client'

// GroupFeed - Feed component for group members
// Shows post composer and list of posts
// Only visible to members, guests/logged-in see intro cards instead

import { Card, CardContent, Button } from "@neo/test-components"
import { useAuthStateSafe } from "../../components/auth-state"
import { 
  Smile, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  Globe,
  Users,
  BadgeCheck,
  Heart,
  ImageIcon,
  HeartHandshake
} from "lucide-react"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { RespectModal } from "./respect-modal"
import { CreatePostModal } from "./create-post-modal"

// Track if user has seen the first respect modal (persists in memory only)
let hasSeenRespectModal = false

// Mock current user
const currentUser = {
  id: "current-user",
  name: "You",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
}

// Post type definition
interface PostData {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    badge?: string
    verified?: boolean
  }
  visibility: string
  visibilityIcon: string
  sharedFrom?: string
  content: string
  mentions?: { text: string; href: string }[]
  timestamp: string
  reactions: { type: string; count: number }[]
  respects: number
  comments: number
  showFollow?: boolean
}

// Mock posts data
const mockPosts: PostData[] = [
  {
    id: "1",
    author: {
      id: "tim-doe",
      name: "Tim Doe, MD. PhD.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
      badge: "🏥",
      verified: false,
    },
    visibility: "Specific Friends...",
    visibilityIcon: "friends",
    content: "Hey John Doe and @Samfsd",
    mentions: [{ text: "John Doe", href: "/profile/john-doe" }],
    timestamp: "4h ago",
    reactions: [],
    respects: 5,
    comments: 0,
  },
  {
    id: "2",
    author: {
      id: "tim-doe",
      name: "Tim Doe, MD. PhD.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
      badge: "🏥",
      verified: false,
    },
    visibility: "Public",
    visibilityIcon: "public",
    content: "I made a post !",
    timestamp: "4h ago",
    reactions: [],
    respects: 12,
    comments: 0,
  },
  {
    id: "3",
    author: {
      id: "jack-doe",
      name: "Jack Doe Junior",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: true,
    },
    visibility: "Public",
    visibilityIcon: "public",
    sharedFrom: "John Doe",
    content: "asdasdasdadssdfsdf",
    timestamp: "29 Nov",
    reactions: [],
    respects: 3,
    comments: 0,
    showFollow: true,
  },
  {
    id: "4",
    author: {
      id: "jack-doe",
      name: "Jack Doe Junior",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: true,
    },
    visibility: "Public",
    visibilityIcon: "public",
    content: "try again",
    timestamp: "28 Nov",
    reactions: [{ type: "heart", count: 1 }, { type: "respect", count: 3 }],
    respects: 8,
    comments: 0,
    showFollow: true,
  },
  {
    id: "5",
    author: {
      id: "sarah-smith",
      name: "Sarah Smith",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      verified: true,
    },
    visibility: "Public",
    visibilityIcon: "public",
    content: "Just joined this amazing community! Looking forward to connecting with everyone here.",
    timestamp: "27 Nov",
    reactions: [{ type: "heart", count: 5 }],
    respects: 15,
    comments: 3,
  },
  {
    id: "6",
    author: {
      id: "mike-johnson",
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      badge: "🎯",
      verified: false,
    },
    visibility: "Public",
    visibilityIcon: "public",
    content: "Great discussion yesterday! Thanks everyone for the insights.",
    timestamp: "26 Nov",
    reactions: [],
    respects: 7,
    comments: 1,
  },
  {
    id: "7",
    author: {
      id: "jack-doe",
      name: "Jack Doe Junior",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: true,
    },
    visibility: "Public",
    visibilityIcon: "public",
    content: "try again",
    timestamp: "25 Nov",
    reactions: [{ type: "heart", count: 1 }, { type: "respect", count: 3 }],
    respects: 8,
    comments: 0,
    showFollow: true,
  },
]

// Track if user has made a post (persists in memory only)
let userHasPosted = false
// Track if auto-prompt has been shown
let hasShownAutoPrompt = false

interface GroupFeedProps {
  groupId: string
}

export function GroupFeed({ groupId }: GroupFeedProps) {
  const { authState } = useAuthStateSafe()
  const isMember = authState === 'group-member'
  const [posts, setPosts] = useState(mockPosts)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isAutoTriggered, setIsAutoTriggered] = useState(false)
  
  // Handle new post creation
  const handleCreatePost = (content: string, profile: { id: string; name: string; avatar?: string; isProtected?: boolean }, audience: { id: string; label: string }) => {
    const newPost: PostData = {
      id: `user-post-${Date.now()}`,
      author: {
        id: profile.id,
        name: profile.isProtected ? 'Anonymous Member' : profile.name,
        avatar: profile.isProtected 
          ? 'https://www.gravatar.com/avatar/?d=mp&s=100' // Default anonymous avatar
          : (profile.avatar || 'https://www.gravatar.com/avatar/?d=mp&s=100'),
        verified: false,
      },
      visibility: audience.label,
      visibilityIcon: audience.id === 'public' ? 'public' : 'friends',
      content: content,
      timestamp: 'Just now',
      reactions: [],
      respects: 0,
      comments: 0,
    }
    
    // Add to beginning of posts
    setPosts(prev => [newPost, ...prev])
    userHasPosted = true
    setShowCreateModal(false)
    setIsAutoTriggered(false)
  }
  
  // Handle modal close
  const handleCloseModal = () => {
    setShowCreateModal(false)
    setIsAutoTriggered(false)
  }
  
  // Handle manual open (from composer button)
  const handleOpenModal = () => {
    setIsAutoTriggered(false)
    setShowCreateModal(true)
  }
  
  // Only render for members
  if (!isMember) {
    return null
  }

  return (
    <div className="space-y-4">
      <PostComposer 
        onOpenModal={handleOpenModal} 
      />
      <PostsList 
        groupId={groupId} 
        posts={posts}
        setPosts={setPosts}
        onAutoPrompt={() => {
          // Auto-prompt for ambient-circle if user hasn't posted
          if (groupId === 'ambient-circle' && !userHasPosted && !hasShownAutoPrompt) {
            hasShownAutoPrompt = true
            setIsAutoTriggered(true)
            setShowCreateModal(true)
          }
        }}
      />
      
      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={showCreateModal} 
        onClose={handleCloseModal}
        onSubmit={handleCreatePost}
        showAdminPrompt={isAutoTriggered}
        adminPromptText="your weekly check-in"
      />
    </div>
  )
}

// Post Composer Component
function PostComposer({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <button
            onClick={onOpenModal}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors cursor-pointer"
          >
            Create new update
          </button>
          <Button 
            variant="secondary" 
            size="md" 
            isIconOnly 
            aria-label="Create post"
            className="cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Posts List with Infinite Scroll
interface PostsListProps {
  groupId: string
  posts: PostData[]
  setPosts: React.Dispatch<React.SetStateAction<PostData[]>>
  onAutoPrompt: () => void
}

function PostsList({ groupId, posts, setPosts, onAutoPrompt }: PostsListProps) {
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const autoPromptObserverRef = useRef<IntersectionObserver | null>(null)
  
  // Callback ref for auto-prompt trigger - fires when 5th post becomes visible
  const autoPromptRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer
    if (autoPromptObserverRef.current) {
      autoPromptObserverRef.current.disconnect()
    }
    
    if (node) {
      autoPromptObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onAutoPrompt()
          }
        },
        { threshold: 0.5 }
      )
      autoPromptObserverRef.current.observe(node)
    }
  }, [onAutoPrompt])
  
  // Simulate loading more posts
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    
    setLoading(true)
    
    // Simulate API delay
    setTimeout(() => {
      // Generate more mock posts
      const newPosts = mockPosts.map((post, index) => ({
        ...post,
        id: `${post.id}-${posts.length + index}`,
        timestamp: `${Math.floor(Math.random() * 30) + 1} days ago`,
      }))
      
      setPosts(prev => [...prev, ...newPosts])
      setLoading(false)
      
      // Stop after 3 loads for demo
      if (posts.length >= 12) {
        setHasMore(false)
      }
    }, 1000)
  }, [loading, hasMore, posts.length, setPosts])
  
  // Set up intersection observer for infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      observerRef.current?.disconnect()
    }
  }, [hasMore, loading, loadMore])

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div key={post.id}>
          <PostCard post={post} />
          {/* Auto-prompt trigger after 5th post */}
          {index === 4 && <div ref={autoPromptRef} />}
        </div>
      ))}
      
      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {loading && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  )
}

// Individual Post Card
function PostCard({ post }: { post: PostData }) {
  const VisibilityIcon = post.visibilityIcon === 'public' ? Globe : Users
  const [respects, setRespects] = useState(post.respects)
  const [hasRespected, setHasRespected] = useState(false)
  const [showRespectModal, setShowRespectModal] = useState(false)
  
  const handleRespect = () => {
    if (hasRespected) {
      setRespects(prev => prev - 1)
      setHasRespected(false)
    } else {
      setRespects(prev => prev + 1)
      setHasRespected(true)
      
      // Show modal on first respect (ever)
      if (!hasSeenRespectModal) {
        setShowRespectModal(true)
        hasSeenRespectModal = true
      }
    }
  }
  
  const handleCloseRespectModal = () => {
    setShowRespectModal(false)
  }
  
  // Parse content with mentions
  const renderContent = () => {
    if (!post.mentions || post.mentions.length === 0) {
      return <p className="text-foreground">{post.content}</p>
    }
    
    const content = post.content
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    
    post.mentions.forEach((mention, idx) => {
      const mentionIndex = content.indexOf(mention.text, lastIndex)
      if (mentionIndex !== -1) {
        // Add text before mention
        if (mentionIndex > lastIndex) {
          parts.push(content.slice(lastIndex, mentionIndex))
        }
        // Add mention link
        parts.push(
          <a 
            key={idx} 
            href={mention.href} 
            className="text-primary hover:underline"
          >
            {mention.text}
          </a>
        )
        lastIndex = mentionIndex + mention.text.length
      }
    })
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }
    
    return <p className="text-foreground">{parts}</p>
  }

  return (
    <>
    <Card className="p-0">
      <CardContent >
        {/* Post Header */}
        <div className="flex items-start gap-2 lg:gap-3 px-4 pt-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0 gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground">
                {post.author.name}
              </span>
              {post.author.badge && (
                <span className="text-sm">{post.author.badge}</span>
              )}
              {post.author.verified && (
                <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
              )}
              {post.showFollow && (
                <>
                  <span className="text-muted-foreground leading-5">·</span>
                  <button className="text-primary text-sm font-medium hover:underline">
                    Follow
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 leading-5 text-xs text-muted-foreground">
              <VisibilityIcon className="w-3.5 h-3.5" />
              <span>{post.visibility}</span>
              {post.sharedFrom && (
                <>
                  <span>·</span>
                  <span>{post.sharedFrom}</span>
                </>
              )}
            </div>
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            {post.timestamp}
          </span>
        </div>
        
        {/* Post Content */}
        <div className="py-0 px-4">
          {renderContent()}
        </div>
        
        {/* Reactions Summary */}
        {(post.reactions.length > 0 || respects > 0) && (
          <div className="flex items-center px-4 gap-3 pb-1 ">
            {respects > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <HeartHandshake className="w-4 h-4" />
                <span>{respects}</span>
              </div>
            )}
            {post.reactions.map((reaction, idx) => {
              const ReactionIcon = reaction.type === 'respect' ? HeartHandshake : Heart
              return (
                <div key={idx} className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ReactionIcon className="w-4 h-4" />
                  <span>{reaction.count}</span>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Post Actions */}
        <div className="flex items-center justify-between pb-2 pt-2 px-2 border-t border-border/20">
          <div className="flex items-center gap-1">
            <Button variant='ghost' size="sm" className="rounded gap-1">
              <Smile className="w-4 h-4 mr-1.5" />
              React
            </Button>
            <button 
              className={`inline-flex items-center justify-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer active:scale-95 ${
                hasRespected 
                  ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={handleRespect}
            >
              <HeartHandshake className="w-4 h-4 mr-1.5" />
              Respect
            </button>
            <Button variant='ghost' size="sm" className="rounded gap-1">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Comment
            </Button>
            <Button variant='ghost' size="sm" className="rounded gap-1">
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </Button>
          </div>
          <Button variant='ghost' size="sm" isIconOnly className="rounded gap-1">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
    
    {/* First Respect Modal */}
    <RespectModal isOpen={showRespectModal} onClose={handleCloseRespectModal} />
    </>
  )
}

// Group Intro Card wrapper - only shows for non-members
interface GroupIntroWrapperProps {
  children: React.ReactNode
}

export function GroupIntroWrapper({ children }: GroupIntroWrapperProps) {
  const { authState } = useAuthStateSafe()
  const isMember = authState === 'group-member'
  
  // Hide intro for members
  if (isMember) {
    return null
  }
  
  return <>{children}</>
}

