"use client"

// GlassyButton Demo - Client component for interactive demos
// Split from the page for optimal server/client separation

import { GlassyButton, Card, CardContent } from "@neo/test-components"
import { 
  Camera, 
  Sparkles, 
  Video, 
  Wand2,
  Heart,
  Star,
  Zap,
} from "lucide-react"

export function GlassyButtonDemo() {
  return (
    <div className="space-y-12">
      {/* Variants */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Variants</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Hover over the buttons to activate the camera feed. Each variant has a different overlay color.
            </p>
            <div className="flex flex-wrap gap-4">
              <GlassyButton variant="default">Default</GlassyButton>
              <GlassyButton variant="primary">Primary</GlassyButton>
              <GlassyButton variant="secondary">Secondary</GlassyButton>
              <GlassyButton variant="dark">Dark</GlassyButton>
              <GlassyButton variant="light">Light</GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sizes */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Sizes</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <GlassyButton size="sm" variant="primary">Small</GlassyButton>
              <GlassyButton size="md" variant="primary">Medium</GlassyButton>
              <GlassyButton size="lg" variant="primary">Large</GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* With Icons */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">With Icons</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <GlassyButton variant="default">
                <Camera className="w-4 h-4" />
                Take Photo
              </GlassyButton>
              <GlassyButton variant="primary">
                <Video className="w-4 h-4" />
                Record
              </GlassyButton>
              <GlassyButton variant="secondary">
                <Sparkles className="w-4 h-4" />
                Magic
              </GlassyButton>
              <GlassyButton variant="dark">
                <Wand2 className="w-4 h-4" />
                Effects
              </GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Icon Only */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Icon Only</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <GlassyButton isIconOnly size="sm" variant="default">
                <Heart className="w-4 h-4" />
              </GlassyButton>
              <GlassyButton isIconOnly variant="primary">
                <Star className="w-4 h-4" />
              </GlassyButton>
              <GlassyButton isIconOnly size="lg" variant="secondary">
                <Zap className="w-5 h-5" />
              </GlassyButton>
              <GlassyButton isIconOnly variant="dark">
                <Camera className="w-4 h-4" />
              </GlassyButton>
              <GlassyButton isIconOnly variant="light">
                <Sparkles className="w-4 h-4" />
              </GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Blur Effects */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Blur Effects</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Apply blur to the camera feed for different aesthetic effects.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <GlassyButton blur="none" variant="primary">No Blur</GlassyButton>
              <GlassyButton blur="sm" variant="primary">Slight Blur</GlassyButton>
              <GlassyButton blur="md" variant="primary">Medium Blur</GlassyButton>
              <GlassyButton blur="lg" variant="primary">Heavy Blur</GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Overlay Opacity */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Overlay Opacity</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Control how much of the camera feed shows through.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <GlassyButton overlayOpacity={0.1} variant="primary">10%</GlassyButton>
              <GlassyButton overlayOpacity={0.3} variant="primary">30%</GlassyButton>
              <GlassyButton overlayOpacity={0.5} variant="primary">50%</GlassyButton>
              <GlassyButton overlayOpacity={0.7} variant="primary">70%</GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Mirror Mode */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Mirror Mode</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Toggle mirror mode for selfie-style reflection or regular camera view.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <GlassyButton mirror={true} variant="secondary" size="lg">
                <Camera className="w-4 h-4" />
                Mirror (Selfie Mode)
              </GlassyButton>
              <GlassyButton mirror={false} variant="secondary" size="lg">
                <Video className="w-4 h-4" />
                No Mirror
              </GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Showcase */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Showcase</h2>
        <Card>
          <CardContent className="p-8 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10">
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Creative combinations for different use cases
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <GlassyButton 
                variant="primary" 
                size="lg" 
                blur="sm"
                overlayOpacity={0.4}
              >
                <Video className="w-5 h-5" />
                Start Live Stream
              </GlassyButton>
              <GlassyButton 
                variant="dark" 
                size="lg" 
                blur="md"
                overlayOpacity={0.5}
              >
                <Sparkles className="w-5 h-5" />
                AR Experience
              </GlassyButton>
              <GlassyButton 
                variant="light" 
                size="lg" 
                blur="sm"
                overlayOpacity={0.6}
              >
                <Camera className="w-5 h-5" />
                Capture Moment
              </GlassyButton>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
