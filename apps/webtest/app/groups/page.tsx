// Groups Index Page - Server Component
// Lists available groups for unauthenticated users to browse
// Uses HeroUI v3 components: Card, Avatar, Chip

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Avatar,
  Chip,
  Button,
  Separator,
} from "@neo/test-components"
import Link from "next/link"
import { 
  Users, 
  Globe, 
  Lock, 
  Search, 
  TrendingUp,
  Star,
  Clock,
} from "lucide-react"
import { PageFooter } from "../components/page-footer"

// Mock groups data - in real app would come from UNA API
const mockGroups = [
  {
    id: "ambient-circle",
    name: "Ambient Circle",
    description: "A safe space for meaningful conversations with protected identities.",
    coverImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=200&fit=crop",
    memberCount: 1234,
    isPublic: false,
    isFeatured: true,
    category: "Support",
    recentActivity: "1 hour ago",
    avatar: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=100&h=100&fit=crop",
  },
  {
    id: "tech-innovators",
    name: "Tech Innovators",
    description: "A community for technology enthusiasts, developers, and innovators.",
    coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop",
    memberCount: 2847,
    isPublic: true,
    isFeatured: true,
    category: "Technology",
    recentActivity: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop",
  },
  {
    id: "design-masters",
    name: "Design Masters",
    description: "Where designers connect, share work, and inspire each other.",
    coverImage: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=200&fit=crop",
    memberCount: 1523,
    isPublic: true,
    isFeatured: true,
    category: "Design",
    recentActivity: "5 hours ago",
    avatar: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&h=100&fit=crop",
  },
  {
    id: "startup-founders",
    name: "Startup Founders",
    description: "Connect with fellow entrepreneurs and share your startup journey.",
    coverImage: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop",
    memberCount: 892,
    isPublic: true,
    isFeatured: false,
    category: "Business",
    recentActivity: "1 day ago",
    avatar: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=100&h=100&fit=crop",
  },
  {
    id: "photography-club",
    name: "Photography Club",
    description: "Share your best shots and learn from fellow photographers.",
    coverImage: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=200&fit=crop",
    memberCount: 3421,
    isPublic: true,
    isFeatured: false,
    category: "Art",
    recentActivity: "3 hours ago",
    avatar: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=100&h=100&fit=crop",
  },
  {
    id: "ai-researchers",
    name: "AI Researchers",
    description: "Discuss the latest in artificial intelligence and machine learning.",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
    memberCount: 4156,
    isPublic: false,
    isFeatured: true,
    category: "Technology",
    recentActivity: "30 minutes ago",
    avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop",
  },
  {
    id: "fitness-motivation",
    name: "Fitness Motivation",
    description: "Your daily dose of fitness inspiration and workout tips.",
    coverImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop",
    memberCount: 5892,
    isPublic: true,
    isFeatured: false,
    category: "Health",
    recentActivity: "4 hours ago",
    avatar: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop",
  },
]

export const metadata = {
  title: 'Browse Groups | NEO',
  description: 'Discover and join communities that match your interests.',
}

export default function GroupsIndexPage() {
  const featuredGroups = mockGroups.filter(g => g.isFeatured)
  const allGroups = mockGroups

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Discover Communities
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Find and join groups that match your interests. Connect with like-minded people and participate in discussions.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Featured Groups */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Featured Groups</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGroups.map((group) => (
                <GroupCard key={group.id} group={group} featured />
              ))}
            </div>
          </section>

          <Separator className="my-8" />

          {/* All Groups */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold">All Groups</h2>
              </div>
              <div className="flex items-center gap-2">
                <Chip className="text-xs cursor-pointer hover:bg-primary/10">All</Chip>
                <Chip className="text-xs cursor-pointer hover:bg-primary/10">Technology</Chip>
                <Chip className="text-xs cursor-pointer hover:bg-primary/10">Design</Chip>
                <Chip className="text-xs cursor-pointer hover:bg-primary/10">Business</Chip>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
              <CardContent className="py-12">
                <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your own group and build a community around your interests.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="primary" asChild>
                    <Link href="/signup">Create Your Group</Link>
                  </Button>
                  <Button variant="tertiary" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <PageFooter pageName="Groups" />
    </>
  )
}

// ============================================
// Group Card Component
// ============================================
interface GroupCardProps {
  group: typeof mockGroups[0]
  featured?: boolean
}

function GroupCard({ group, featured = false }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`} className="block group">
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/30">
        {/* Cover Image with Avatar */}
        <div className="relative">
          {/* Cover */}
          <div className="h-32 overflow-hidden rounded">
            <img
              src={group.coverImage}
              alt={`${group.name} cover`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded " />
          </div>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {featured && (
              <Chip className="text-xs bg-primary text-primary-foreground">
                <Star className="w-3 h-3 mr-1" /> Featured
              </Chip>
            )}
            <Chip className="text-xs bg-background/80 backdrop-blur-sm">
              {group.isPublic ? (
                <><Globe className="w-3 h-3 mr-1" /> Public</>
              ) : (
                <><Lock className="w-3 h-3 mr-1" /> Private</>
              )}
            </Chip>
          </div>
          
          {/* Avatar - positioned half over cover */}
          <div className="absolute right-2 -bottom-12">
            <img
              src={group.avatar}
              alt={group.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-card"
            />
          </div>
        </div>

        <CardContent className="">
          <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">
            {group.name}
          </CardTitle>
          <CardDescription className="line-clamp-2 mb-3">
            {group.description}
          </CardDescription>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{group.memberCount.toLocaleString()} members</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{group.recentActivity}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

