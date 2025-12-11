"use client"

// GlassyLink - Client wrapper to use GlassyButton as a link
import { GlassyButton } from "@neo/test-components"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"

type GlassyButtonProps = ComponentProps<typeof GlassyButton>

interface GlassyLinkProps extends Omit<GlassyButtonProps, 'onClick'> {
  href: string
}

export function GlassyLink({ href, children, ...props }: GlassyLinkProps) {
  const router = useRouter()
  
  return (
    <GlassyButton
      {...props}
      onClick={() => router.push(href)}
    >
      {children}
    </GlassyButton>
  )
}
