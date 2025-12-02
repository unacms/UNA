// Ambient Circle Group Page - Server Component
// A trusted space for important conversations with protected identities
// Layout: no cover image, header → tabs → content

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Avatar,
  Chip,
  Separator,
  Button,
} from "@neo/test-components"
// Removed ListBox - using simple div structure instead to avoid hydration issues
import Link from "next/link"
import { 
  Users, 
  Shield, 
  Lock, 
  MapPin, 
  Share2, 
  UserPlus,
  Eye,
  EyeOff,
  Calendar,
  VolumeX,
} from "lucide-react"
import { PageFooter } from "../../components/page-footer"
import { GroupTabs } from "../[id]/group-tabs"
import { GroupSwitcher, GroupSwitcherTrigger } from "../../components/group-switcher"

// Ambient Circle group data
const ambientCircle = {
  id: "ambient-circle",
  name: "Ambient Circle",
  description: "A safe space for meaningful conversations where your identity is protected. Share, listen, and connect without judgment.",
  avatar: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=200&h=200&fit=crop",
  memberCount: 1234,
  isPublic: false,
  isVisible: true,
  location: "Global",
  createdAt: "2024-01-10",
  intro: `
    <p><strong>Welcome to Ambient Circle</strong> — where important conversations happen.</p>
    <p>Sometimes we need a space to share what's on our mind without worrying about who's watching. Here, your name stays protected, allowing authentic connection and support.</p>
    <ul>
      <li>🛡️ Protected identities — speak freely</li>
      <li>💬 Meaningful conversations that matter</li>
      <li>🤝 Supportive community without judgment</li>
      <li>🔒 Your privacy is our priority</li>
    </ul>
    <p>You don't have to go through it alone.</p>
  `,
  admins: [
    { id: "1", name: "Guardian", avatar: "https://i.pravatar.cc/150?u=guardian" },
    { id: "2", name: "Listener", avatar: "https://i.pravatar.cc/150?u=listener" },
  ],
  recentMembers: [
    { id: "3", name: "Anonymous", avatar: "https://i.pravatar.cc/150?u=anon1" },
    { id: "4", name: "Anonymous", avatar: "https://i.pravatar.cc/150?u=anon2" },
    { id: "5", name: "Anonymous", avatar: "https://i.pravatar.cc/150?u=anon3" },
    { id: "6", name: "Anonymous", avatar: "https://i.pravatar.cc/150?u=anon4" },
    { id: "7", name: "Anonymous", avatar: "https://i.pravatar.cc/150?u=anon5" },
  ],
}

export const metadata = {
  title: `${ambientCircle.name} | NEO Groups`,
  description: ambientCircle.description,
}

export default function AmbientCirclePage() {
  const group = ambientCircle

  // Feed tab content
  const feedContent = (
    <div className="max-w-7xl mx-auto px-2 lg:px-6 lg:py-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GroupIntroCard intro={group.intro} />
          <AppIntroCard />
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
              <CardTitle>Community Guidelines</CardTitle>
              <CardDescription>Creating a safe space for everyone</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Respect everyone's privacy and protected identity</li>
                <li>Listen with empathy and respond with kindness</li>
                <li>No harassment, bullying, or harmful behavior</li>
                <li>Keep conversations confidential — what's shared here, stays here</li>
                <li>Reach out if you or someone needs professional support</li>
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
              <CardTitle>Community Members</CardTitle>
              <CardDescription>{group.memberCount.toLocaleString()} people in this safe space</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Notice about protected names */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Protected Identities</p>
                    <p className="text-sm text-muted-foreground">
                      Members in this community use protected names to speak freely and authentically.
                    </p>
                  </div>
                </div>

                {/* Moderators */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Moderators & Guides</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.admins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <Avatar className="w-10 h-10">
                          <Avatar.Image src={admin.avatar} alt={admin.name} />
                          <Avatar.Fallback>{admin.name.charAt(0)}</Avatar.Fallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{admin.name}</p>
                          <p className="text-xs text-muted-foreground">Guide</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Sign in CTA */}
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    Join to connect with {group.memberCount.toLocaleString()} members
                  </p>
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/login">Join the Circle</Link>
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

  // Respect tab content - people who respected you
  const respectContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>People Who Respected You</CardTitle>
          <CardDescription>Members who have shown appreciation for your contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample respect items */}
            {[
              { id: "1", name: "Anonymous Star", avatar: "https://i.pravatar.cc/150?u=star1", time: "2 hours ago", post: "Your post about finding inner peace" },
              { id: "2", name: "Supportive Friend", avatar: "https://i.pravatar.cc/150?u=friend1", time: "5 hours ago", post: "Your comment on dealing with change" },
              { id: "3", name: "Kind Soul", avatar: "https://i.pravatar.cc/150?u=soul1", time: "1 day ago", post: "Your story about overcoming challenges" },
              { id: "4", name: "Grateful Heart", avatar: "https://i.pravatar.cc/150?u=heart1", time: "2 days ago", post: "Your advice on staying positive" },
              { id: "5", name: "Inspired One", avatar: "https://i.pravatar.cc/150?u=inspired1", time: "3 days ago", post: "Your thoughts on community support" },
            ].map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Avatar className="w-12 h-12 shrink-0">
                  <Avatar.Image src={item.avatar} alt={item.name} />
                  <Avatar.Fallback>{item.name.charAt(0)}</Avatar.Fallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">respected you</span>
                    <span className="text-xs text-muted-foreground">• {item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    On: "{item.post}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Mutes tab content - posts you muted
  const mutesContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Muted Posts</CardTitle>
          <CardDescription>Posts you've chosen not to see in your feed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample muted posts */}
            {[
              { id: "1", author: "Anonymous Member", preview: "This conversation about politics was getting too heated...", time: "1 day ago" },
              { id: "2", author: "Community Voice", preview: "Off-topic discussion that didn't interest me...", time: "3 days ago" },
              { id: "3", author: "Group Contributor", preview: "Repeated content I've already seen...", time: "1 week ago" },
            ].map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.author}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.preview}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs">
                    Unmute Post
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Empty state hint */}
            <p className="text-center text-sm text-muted-foreground py-4">
              Muted posts are hidden from your feed but can be unmuted anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* No cover image for this group - intentionally omitted */}

        {/* Group Header - Name, Actions */}
        <GroupHeader group={group} />

        {/* Group Tabs with Content */}
        <GroupTabs 
          groupId={group.id}
          groupName={group.name}
          groupAvatar={group.avatar}
          feedContent={feedContent}
          aboutContent={aboutContent}
          membersContent={membersContent}
          respectContent={respectContent}
          mutesContent={mutesContent}
        />
      </div>

      <PageFooter pageName="Ambient Circle" />
    </>
  )
}

// ============================================
// Group Header Component (no cover image version)
// ============================================
function GroupHeader({ group }: { group: typeof ambientCircle }) {
  return (
    <div id="group-header" className="bg-card border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Group Avatar + Info Column */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Avatar - link to group home */}
            <Link href={`/groups/${group.id}`} className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full overflow-hidden">
              <img 
                src={group.avatar} 
                alt={group.name} 
                className="w-full h-full object-cover"
              />
            </Link>
            
            {/* Title + Meta Info Column */}
            <div className="min-w-0 flex-1">
              {/* Title Row */}
              <div className="flex items-center gap-2">
                <Link href={`/groups/${group.id}`} className="hover:underline">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                    {group.name}
                  </h1>
                </Link>
                <GroupSwitcherTrigger
                  currentGroupId={group.id}
                  currentGroupName={group.name}
                />
              </div>
              
              {/* Meta Info - under title */}
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
// Group Intro Card - with conversation illustration
// ============================================
function GroupIntroCard({ intro }: { intro: string }) {
  return (
    <Card className="p-2 gap-0">
      {/* Warm illustration of people in conversation */}
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/20">
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=450&fit=crop"
          alt="People having meaningful conversations"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
      <CardContent className="p-4">
        {/* Rich text intro */}
        <div 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
      </CardContent>
    </Card>
  )
}

// ============================================
// App Intro Card - "Where important conversations happen"
// ============================================
function AppIntroCard() {
  return (
    <Card className="p-2 overflow-hidden bg-linear-to-b from-stone-100 via-amber-50 to-orange-50 dark:from-stone-900 dark:via-amber-950/50 dark:to-orange-950/30">
      {/* Warm gradient background similar to screenshot */}
      <div className="relative ">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left side - Text content */}
            <div className="p-4 md:p-6 flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100 leading-tight mb-4">
                Where important conversations happen
              </h2>
              <p className="text-lg text-stone-600 dark:text-stone-300 mb-6">
                You don't have to go through it alone
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" className="bg-stone-700 hover:bg-stone-800 text-white" asChild>
                  <Link href="/groups">Join a community</Link>
                </Button>
                <Button variant="secondary" className="bg-stone-200/80 hover:bg-stone-300 text-stone-800 border-stone-300" asChild>
                  <Link href="/signup">Start a community</Link>
                </Button>
              </div>
            </div>
            
            {/* Right side - Illustration */}
            <div className="relative min-h-[280px] md:min-h-[320px] flex items-end justify-center overflow-hidden rounded">
             
              {/* Illustration image - people in conversation */}
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&h=400&fit=crop"
                alt="People connecting in conversation"
                className="relative z-10 w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

// ============================================
// Group About Sidebar Card
// ============================================
function GroupAboutCard({ group }: { group: typeof ambientCircle }) {
  const infoItems = [
    {
      id: "privacy",
      icon: Shield,
      value: "Protected Names",
      description: "Members can speak freely with protected identities",
    },
    {
      id: "visibility",
      icon: Lock,
      value: "Private Group",
      description: "Only members can see who's here and what's shared",
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
      description: "A worldwide community",
    },
    {
      id: "members",
      icon: Users,
      value: `${group.memberCount.toLocaleString()} members`,
      description: "People supporting each other",
    },
    {
      id: "created",
      icon: Calendar,
      value: new Date(group.createdAt).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }),
      description: "When this circle began",
    },
  ]

  return (
    <Card className="p-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-0">
        <CardTitle className="text-lg">About</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Group description */}
        <p className="px-4 py-3 text-sm text-muted-foreground">
          {group.description}
        </p>
        
          {infoItems.map((item) => (
            <div key={item.id} className="px-4 pb-4 flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-sm text-foreground">{item.value}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{item.description}</span>
              </div>
            </div>
          ))}
        
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
  admins: typeof ambientCircle.admins
  recentMembers: typeof ambientCircle.recentMembers
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Guides & Moderators</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-3">
              <Avatar className="w-8 h-8 rounded-full overflow-hidden">
                <Avatar.Image src={admin.avatar} alt={admin.name} />
                <Avatar.Fallback>{admin.name.charAt(0)}</Avatar.Fallback>
              </Avatar>
              <span className="text-sm font-medium">{admin.name}</span>
              <Chip className="text-xs ml-auto bg-primary/10 text-primary">Guide</Chip>
            </div>
          ))}
        </div>
        
        {/* Privacy note */}
        <div className="mt-3 p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Member identities are protected
          </p>
        </div>
        
       
      </CardContent>
    </Card>
  )
}

