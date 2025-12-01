// Group Page - Server Component for unauthenticated users
// Demonstrates HeroUI v3 components: Card, Avatar, ListBox, Surface, Skeleton
// Following the layout structure: cover → header → tabs → content

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter,
  Avatar,
  Chip,
  Separator,
  Surface,
  Button,
  Tabs,
} from "@neo/test-components"
import Link from "next/link"
import { 
  Users, 
  Globe, 
  Lock, 
  MapPin, 
  Share2, 
  MoreHorizontal,
  MessageSquare,
  Info,
  UserPlus,
  Flag,
  Settings,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react"
import { PageFooter } from "../../components/page-footer"

// Sample group data - in real app would come from UNA API
const mockGroup = {
  id: "tech-innovators",
  name: "Tech Innovators",
  description: "A community for technology enthusiasts, developers, and innovators to share ideas, collaborate on projects, and stay updated with the latest tech trends.",
  coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop",
  memberCount: 2847,
  isPublic: true,
  isVisible: true,
  location: "Global",
  createdAt: "2023-06-15",
  intro: `
    <p>Welcome to <strong>Tech Innovators</strong> – your hub for all things technology!</p>
    <p>Whether you're a seasoned developer, a curious beginner, or someone passionate about the future of tech, this is the place for you. We believe in the power of community-driven innovation.</p>
    <ul>
      <li>🚀 Share your projects and get feedback</li>
      <li>💡 Discuss emerging technologies and trends</li>
      <li>🤝 Connect with like-minded innovators</li>
      <li>📚 Learn from expert-led discussions and resources</li>
    </ul>
    <p>Join us in shaping the future of technology, one idea at a time.</p>
  `,
  admins: [
    { id: "1", name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah" },
    { id: "2", name: "Marcus Johnson", avatar: "https://i.pravatar.cc/150?u=marcus" },
  ],
  recentMembers: [
    { id: "3", name: "Alex Rivera", avatar: "https://i.pravatar.cc/150?u=alex" },
    { id: "4", name: "Jordan Lee", avatar: "https://i.pravatar.cc/150?u=jordan" },
    { id: "5", name: "Taylor Kim", avatar: "https://i.pravatar.cc/150?u=taylor" },
    { id: "6", name: "Casey Morgan", avatar: "https://i.pravatar.cc/150?u=casey" },
    { id: "7", name: "Jamie Brown", avatar: "https://i.pravatar.cc/150?u=jamie" },
  ],
}

export const metadata = {
  title: `${mockGroup.name} | NEO Groups`,
  description: mockGroup.description,
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const group = mockGroup

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Cover Image Section */}
        <GroupCoverImage src={group.coverImage} alt={group.name} />

        {/* Group Header - Name, Actions */}
        <GroupHeader group={group} />

        {/* Group Tabs */}
        <GroupNavTabs />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Group Intro Card */}
              <GroupIntroCard intro={group.intro} />

              {/* App-wide CTA Card */}
              <AppIntroCard />

              {/* Recent Activity Preview - shows unauthenticated users what they're missing */}
              <ActivityPreviewCard />
            </div>

            {/* Right Column - About Sidebar */}
            <div className="space-y-6">
              {/* About Card */}
              <GroupAboutCard group={group} />

              {/* Members Preview */}
              <GroupMembersCard 
                memberCount={group.memberCount} 
                admins={group.admins}
                recentMembers={group.recentMembers}
              />
            </div>
          </div>
        </div>
      </div>

      <PageFooter pageName="Group" />
    </>
  )
}

// ============================================
// Group Cover Image Component
// ============================================
function GroupCoverImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full aspect-[16/6] sm:aspect-[16/5] lg:aspect-[16/4] bg-muted overflow-hidden">
      <img
        src={src}
        alt={`${alt} cover`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  )
}

// ============================================
// Group Header Component
// ============================================
function GroupHeader({ group }: { group: typeof mockGroup }) {
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Group Name and Chips */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                {group.name}
              </h1>
              <div className="flex items-center gap-2">
                <Chip className="text-xs">
                  {group.isPublic ? (
                    <><Globe className="w-3 h-3 mr-1" /> Public</>
                  ) : (
                    <><Lock className="w-3 h-3 mr-1" /> Private</>
                  )}
                </Chip>
                {group.isVisible && (
                  <Chip className="text-xs bg-primary/10 text-primary">
                    <Eye className="w-3 h-3 mr-1" /> Visible
                  </Chip>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{group.memberCount.toLocaleString()} members</span>
              <span className="text-border">•</span>
              <MapPin className="w-4 h-4" />
              <span>{group.location}</span>
            </p>
          </div>

          {/* Main Actions */}
          <div className="flex items-center gap-2">
            <Button variant="primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Join Group
            </Button>
            <Button variant="secondary">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Group Navigation Tabs
// ============================================
function GroupNavTabs() {
  return (
    <div className="bg-card border-b border-border sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Tabs */}
          <nav className="flex -mb-px">
            <TabLink href="#feed" active>
              <MessageSquare className="w-4 h-4 mr-2" />
              Feed
            </TabLink>
            <TabLink href="#about">
              <Info className="w-4 h-4 mr-2" />
              About
            </TabLink>
            <TabLink href="#members">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabLink>
          </nav>

          {/* Actions Menu - Server rendered dropdown trigger */}
          <div className="py-2">
            <ActionsMenu />
          </div>
        </div>
      </div>
    </div>
  )
}

function TabLink({ 
  href, 
  children, 
  active = false 
}: { 
  href: string
  children: React.ReactNode
  active?: boolean 
}) {
  return (
    <a
      href={href}
      className={`
        inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors
        ${active 
          ? 'border-primary text-primary' 
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        }
      `}
    >
      {children}
    </a>
  )
}

function ActionsMenu() {
  // For unauthenticated users, show limited actions
  return (
    <div className="relative group">
      <button className="button button--sm button--ghost">
        <MoreHorizontal className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">More Actions</span>
      </button>
      {/* Dropdown would be interactive - shown as static for SSR demo */}
      <div className="hidden group-hover:block absolute right-0 top-full mt-1 py-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
        <a href="#" className="dropdown__item flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Share Group
        </a>
        <a href="#" className="dropdown__item flex items-center gap-2">
          <Flag className="w-4 h-4" /> Report Group
        </a>
      </div>
    </div>
  )
}

// ============================================
// Group Intro Card
// ============================================
function GroupIntroCard({ intro }: { intro: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">About This Group</CardTitle>
      </CardHeader>
      <CardContent>
        <Surface className="p-4 bg-muted/30 rounded-lg">
          {/* Rich text intro - sanitized HTML in real app */}
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        </Surface>
      </CardContent>
    </Card>
  )
}

// ============================================
// App-wide CTA Card
// ============================================
function AppIntroCard() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Join the Community</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Sign up to join groups, connect with members, and participate in discussions.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button variant="tertiary" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Activity Preview Card (for unauthenticated)
// ============================================
function ActivityPreviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Join to see and participate in discussions</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Blurred/locked content preview */}
        <div className="relative">
          <div className="space-y-4 opacity-50 blur-[2px] select-none">
            <ActivityItem />
            <ActivityItem />
            <ActivityItem />
          </div>
          {/* Overlay CTA */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="text-center p-6">
              <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                Sign in to view group activity
              </p>
              <Button variant="primary" size="sm" asChild>
                <Link href="/login">Sign In to View</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem() {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    </div>
  )
}

// ============================================
// Group About Sidebar Card
// ============================================
function GroupAboutCard({ group }: { group: typeof mockGroup }) {
  const infoItems = [
    {
      icon: Globe,
      label: "Visibility",
      value: group.isPublic ? "Public Group" : "Private Group",
      description: group.isPublic 
        ? "Anyone can see who's in the group and what they post"
        : "Only members can see who's in the group and what they post",
    },
    {
      icon: group.isVisible ? Eye : EyeOff,
      label: "Discoverability",
      value: group.isVisible ? "Visible" : "Hidden",
      description: group.isVisible 
        ? "Anyone can find this group in search"
        : "Only members can find this group",
    },
    {
      icon: MapPin,
      label: "Location",
      value: group.location,
      description: "Where most members are located",
    },
    {
      icon: Users,
      label: "Members",
      value: `${group.memberCount.toLocaleString()} members`,
      description: "Total community members",
    },
    {
      icon: Calendar,
      label: "Created",
      value: new Date(group.createdAt).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }),
      description: "When this group was founded",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">About</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Info List using ListBox pattern */}
        <ul className="divide-y divide-border" role="list">
          {infoItems.map((item, index) => (
            <li key={index} className="px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ============================================
// Group Members Preview Card
// ============================================
function GroupMembersCard({ 
  memberCount, 
  admins,
  recentMembers,
}: { 
  memberCount: number
  admins: typeof mockGroup.admins
  recentMembers: typeof mockGroup.recentMembers
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Members</CardTitle>
          <Chip className="text-xs">{memberCount.toLocaleString()}</Chip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admins Section */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Admins
          </p>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <Avatar.Image src={admin.avatar} alt={admin.name} />
                  <Avatar.Fallback>{admin.name.charAt(0)}</Avatar.Fallback>
                </Avatar>
                <span className="text-sm font-medium">{admin.name}</span>
                <Chip className="text-xs ml-auto">Admin</Chip>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Recent Members */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recent Members
          </p>
          {/* Stacked Avatars */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {recentMembers.slice(0, 5).map((member) => (
                <Avatar 
                  key={member.id} 
                  className="w-8 h-8 border-2 border-card"
                >
                  <Avatar.Image src={member.avatar} alt={member.name} />
                  <Avatar.Fallback>{member.name.charAt(0)}</Avatar.Fallback>
                </Avatar>
              ))}
            </div>
            {memberCount > 5 && (
              <span className="ml-3 text-sm text-muted-foreground">
                +{(memberCount - 5).toLocaleString()} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border">
        <Button variant="ghost" className="w-full" asChild>
          <Link href="#members">
            View All Members
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

