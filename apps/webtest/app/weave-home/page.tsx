// Weave Home - Member Landing Page
// Shows groups list on left, intro card on right

import { Card, CardContent, CardHeader, CardTitle, CardDescription, ListBox } from "@heroui/react"
import { Avatar } from "@neo/test-components"
import { Users, Fingerprint, HeartHandshake, Handshake } from "lucide-react"
import Link from "next/link"
import { PageFooter } from "@/app/components/page-footer"

export const metadata = {
  title: "Weave Home | NEO",
  description: "Your groups and communities on Weave",
}

// Mock groups data based on screenshot
const mockGroups = [
  {
    id: "ambient-circle",
    name: "Ambient Circle",
    avatar: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&h=100&fit=crop",
    initial: "A",
    color: "bg-amber-500",
  },
  {
    id: "heterodox-forum",
    name: "The Heterodox Forum",
    avatar: null,
    initial: "T",
    color: "bg-cyan-500",
  },
  {
    id: "no-left-turn",
    name: "No Left Turn in Education",
    avatar: null,
    initial: "N",
    color: "bg-orange-500",
  },
  {
    id: "ehsb-talk",
    name: "EHSB Talk",
    avatar: null,
    initial: "E",
    color: "bg-pink-500",
  },
  {
    id: "nj-coalition",
    name: "New Jersey Coalition For Democracy Reform",
    avatar: null,
    initial: "N",
    color: "bg-cyan-500",
  },
  {
    id: "berkeley-against-bullying",
    name: "Berkeley Against Bullying",
    avatar: null,
    initial: "B",
    color: "bg-purple-500",
  },
  {
    id: "contraband-wagon",
    name: "The Contraband Wagon",
    avatar: null,
    initial: "T",
    color: "bg-cyan-500",
  },
  {
    id: "faoc",
    name: "FAOC",
    avatar: null,
    initial: "F",
    color: "bg-green-500",
  },
  {
    id: "wrong-speak",
    name: "Wrong Speak",
    avatar: null,
    initial: "W",
    color: "bg-amber-600",
  },
  {
    id: "going-unbroken",
    name: "Going Unbroken",
    avatar: "https://i.pravatar.cc/100?u=unbroken",
    initial: "G",
    color: "bg-stone-400",
  },
  {
    id: "founder-optimization",
    name: "Founder Optimization",
    avatar: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
    initial: "F",
    color: "bg-red-500",
  },
]

export default function WeaveHomePage() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side - Groups list */}
            <div className="lg:col-span-4">
              <Card className="p-0 border-border/60 shadow-lg">
                
                <CardContent className="p-0">
                  <ListBox 
                    aria-label="Your groups" 
                    selectionMode="single"
                    className="p-2"
                  >
                    {mockGroups.map((group) => (
                      <ListBox.Item 
                        key={group.id} 
                        id={group.id}
                        textValue={group.name}
                        href={`/groups/${group.id}`}
                        className="rounded overflow-hidden hover:bg-muted/50 cursor-pointer px-2 py-1"
                      >
                        <div className="flex items-center gap-3 py-1">
                          {group.avatar ? (
                            <Avatar className="w-10 h-10 shrink-0 rounded-full overflow-hidden">
                              <Avatar.Image src={group.avatar} alt={group.name} />
                              <Avatar.Fallback className={group.color}>{group.initial}</Avatar.Fallback>
                            </Avatar>
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${group.color} flex items-center justify-center text-white font-semibold shrink-0`}>
                              {group.initial}
                            </div>
                          )}
                          <span className="font-medium text-sm truncate">{group.name}</span>
                        </div>
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Intro card */}
            <div className="lg:col-span-8">
              <WeaveIntroCard />
            </div>
          </div>
        </div>
      </div>

      <PageFooter pageName="Weave Home" />
    </>
  )
}

// Extended intro card based on screenshot
function WeaveIntroCard() {
  return (
    <Card className="bg-stone-100 dark:bg-stone-900 border-border/60  overflow-hidden">
      <CardContent className="p-8 md:p-12">
        {/* Main headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-stone-900 dark:text-stone-100 text-center mb-6">
          Speak Freely. Get Real Results.
        </h2>

        {/* Subtitle paragraph */}
        <p className="text-center text-stone-700 dark:text-stone-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          <span className="font-semibold">Weave groups give you the freedom to be 100% you.</span>{" "}
          Speak openly without risking your privacy. Here, everyone uses protected names on difficult topics. 
          That means you can speak honestly without worrying about unwanted eyes and still make real connections. 
          The result? Expert-led conversations with others dealing with the same issues.
        </p>

        {/* Three feature columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Feature 1: Choose Your Name */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Fingerprint className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">Choose Your Name</h3>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Real name or protected? When you use a protected name, it changes on every post. 
              Nobody links your writing back to you—unless you choose.
            </p>
          </div>

          {/* Feature 2: Earn Respect */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <HeartHandshake className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">Earn Respect</h3>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Tap "Respect" on posts you appreciate. Once you and someone else click each other three times, 
              you can reveal real names—only to each other.
            </p>
          </div>

          {/* Feature 3: Build Real Trust */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Handshake className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">Build Real Trust</h3>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Three mutual respects unlock the ability to swap real names. That means deeper bonds, 
              honest feedback, and no fear of repercussions.
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-stone-500 dark:text-stone-500 italic text-sm max-w-2xl mx-auto">
          When you can speak 100% openly—knowing you're fully protected—you'll discover how much faster you learn and grow.
        </p>
      </CardContent>
    </Card>
  )
}

