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
  FileText,
  MessageSquareText,
  BadgeCheck,
  Heart
} from "lucide-react"
import React, { useState, useEffect, useRef, useCallback } from "react"

// Mock current user
const currentUser = {
  id: "current-user",
  name: "You",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
}

// Mock posts data
const mockPosts = [
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
    reactions: [{ type: "heart", count: 1 }],
    comments: 0,
    showFollow: true,
  },
]

interface GroupFeedProps {
  groupId: string
}

export function GroupFeed({ groupId }: GroupFeedProps) {
  const { authState } = useAuthStateSafe()
  const isMember = authState === 'group-member'
  
  // Only render for members
  if (!isMember) {
    return null
  }

  return (
    <div className="space-y-4">
      <PostComposer />
      <PostsList groupId={groupId} />
    </div>
  )
}

// Post Composer Component
function PostComposer() {
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
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors"
          >
            Create new update
          </button>
          <Button variant="tertiary" size="sm" isIconOnly aria-label="Create post">
            <FileText className="w-5 h-5" />
          </Button>
          <Button variant="tertiary" size="sm" isIconOnly aria-label="Create discussion">
            <MessageSquareText className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Posts List with Infinite Scroll
function PostsList({ groupId }: { groupId: string }) {
  const [posts, setPosts] = useState(mockPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  
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
  }, [loading, hasMore, posts.length])
  
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
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
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
interface Post {
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
  comments: number
  showFollow?: boolean
}

function PostCard({ post }: { post: Post }) {
  const VisibilityIcon = post.visibilityIcon === 'public' ? Globe : Users
  
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
    <Card className="p-0">
      <CardContent >
        {/* Post Header */}
        <div className="flex items-start gap-3.5 px-4 pt-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground">
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
                  <span className="text-muted-foreground">·</span>
                  <button className="text-primary text-sm font-medium hover:underline">
                    Follow
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
        {post.reactions.length > 0 && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
            {post.reactions.map((reaction, idx) => (
              <div key={idx} className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span>{reaction.count}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Post Actions */}
        <div className="flex items-center justify-between pb-3.5 pt-3 px-4 border-t border-border">
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" className="text-muted-foreground hover:text-foreground">
              <Smile className="w-4 h-4 mr-1.5" />
              React
            </Button>
            <Button variant="secondary" size="sm" className="text-muted-foreground hover:text-foreground">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Comment
            </Button>
            <Button variant="secondary" size="sm" className="text-muted-foreground hover:text-foreground">
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </Button>
          </div>
          <Button variant="tertiary" size="sm" isIconOnly className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
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

