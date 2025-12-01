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
  Button,
} from "@neo/test-components"
import { ListBox, Label, Description } from "@heroui/react"
import Link from "next/link"
import { 
  Users, 
  Globe, 
  Lock, 
  MapPin, 
  Share2, 
  UserPlus,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react"
import { PageFooter } from "../../components/page-footer"
import { GroupTabs } from "./group-tabs"
import { AppLogo } from "../../components/app-logo"

// Sample group data - in real app would come from UNA API
const mockGroup = {
  id: "tech-innovators",
  name: "Tech Innovators",
  description: "A community for technology enthusiasts, developers, and innovators to share ideas, collaborate on projects, and stay updated with the latest tech trends.",
  coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop",
  avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop",
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

  // Feed tab content
  const feedContent = (
    <div className="max-w-7xl mx-auto px-2 lg:px-6 lg:py-2 ">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GroupIntroCard intro={group.intro} />
          <AppIntroCard />
          {/* <ActivityPreviewCard /> */}
        </div>
        <div className="space-y-6">
          <GroupAboutCard group={group} />
          <GroupMembersCard 
            memberCount={group.memberCount} 
            admins={group.admins}
            recentMembers={group.recentMembers}
          />
        </div>
      </div>
    </div>
  )

  // About tab content
  const aboutContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GroupIntroCard intro={group.intro} />
          <Card>
            <CardHeader>
              <CardTitle>Group Rules</CardTitle>
              <CardDescription>Guidelines for participating in this community</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Be respectful and inclusive to all members</li>
                <li>Stay on topic - keep discussions relevant to technology</li>
                <li>No spam, self-promotion, or advertising without approval</li>
                <li>Share knowledge freely and help others learn</li>
                <li>Give credit when sharing others' work or ideas</li>
              </ol>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <GroupAboutCard group={group} />
        </div>
      </div>
    </div>
  )

  // Members tab content
  const membersContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Members</CardTitle>
              <CardDescription>{group.memberCount.toLocaleString()} people in this group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Admins */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Admins & Moderators</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.admins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <Avatar className="w-10 h-10">
                          <Avatar.Image src={admin.avatar} alt={admin.name} />
                          <Avatar.Fallback>{admin.name.charAt(0)}</Avatar.Fallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{admin.name}</p>
                          <p className="text-xs text-muted-foreground">Admin</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Recent Members */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Members</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.recentMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <Avatar className="w-10 h-10">
                          <Avatar.Image src={member.avatar} alt={member.name} />
                          <Avatar.Fallback>{member.name.charAt(0)}</Avatar.Fallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground">Member</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sign in CTA for full member list */}
                <div className="text-center py-6 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign in to see all {group.memberCount.toLocaleString()} members
                  </p>
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <GroupMembersCard 
            memberCount={group.memberCount} 
            admins={group.admins}
            recentMembers={group.recentMembers}
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Cover Image Section */}
        <GroupCoverImage src={group.coverImage} alt={group.name} />

        {/* Group Header - Name, Actions */}
        <GroupHeader group={group} />

        {/* Group Tabs with Content */}
        <GroupTabs 
          groupName={group.name}
          groupAvatar={group.avatar}
          feedContent={feedContent}
          aboutContent={aboutContent}
          membersContent={membersContent}
        />
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
    <div id="group-header" className="bg-card border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Group Avatar, Name and Chips */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Large Profile Avatar */}
            <img
              src={group.avatar}
              alt={group.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-background shadow shrink-0"
            />
            <div className="min-w-0">
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
          </div>

          {/* Main Actions */}
          <div className="flex items-center gap-2">
            <Button variant="primary">
              <UserPlus className="w-4 h-4" />
              Join Group
            </Button>
            <Button variant="secondary">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Group Intro Card
// ============================================
function GroupIntroCard({ intro }: { intro: string }) {
  return (
    <Card className="p-2 gap-0">
      {/* 16:9 Featured Image */}
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=450&fit=crop"
          alt="Group featured content"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        {/* Rich text intro - sanitized HTML in real app */}
        <div 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
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
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <AppLogo mode="mark" markSize={40} />
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
      id: "visibility",
      icon: Globe,
      value: group.isPublic ? "Public Group" : "Private Group",
      description: group.isPublic 
        ? "Anyone can see who's in the group and what they post"
        : "Only members can see who's in the group and what they post",
    },
    {
      id: "discoverability",
      icon: group.isVisible ? Eye : EyeOff,
      value: group.isVisible ? "Visible" : "Hidden",
      description: group.isVisible 
        ? "Anyone can find this group in search"
        : "Only members can find this group",
    },
    {
      id: "location",
      icon: MapPin,
      value: group.location,
      description: "Where most members are located",
    },
    {
      id: "members",
      icon: Users,
      value: `${group.memberCount.toLocaleString()} members`,
      description: "Total community members",
    },
    {
      id: "created",
      icon: Calendar,
      value: new Date(group.createdAt).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }),
      description: "When this group was founded",
    },
  ]

  return (
    <Card className="p-0">
      <CardHeader className="px-4 pt-4">
        <CardTitle className="text-lg">About</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ListBox aria-label="Group information" selectionMode="none" className="p-0">
          {infoItems.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.value} className="px-4 py-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <Label>{item.value}</Label>
                <Description>{item.description}</Description>
              </div>
            </ListBox.Item>
          ))}
        </ListBox>
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
          <CardTitle className="text-lg">Admins & Moderators</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Admins Section */}
       
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8 rounded-full overflow-hidden">
                  <Avatar.Image src={admin.avatar} alt={admin.name} />
                  <Avatar.Fallback>{admin.name.charAt(0)}</Avatar.Fallback>
                </Avatar>
                <span className="text-sm font-medium">{admin.name}</span>
                <Chip className="text-xs ml-auto">Admin</Chip>
              </div>
            ))}
    
        </div>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="#members">
            View All Members
          </Link>
        </Button>
        
      </CardContent>
     
    </Card>
  )
}

