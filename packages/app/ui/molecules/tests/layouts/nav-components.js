'use client'

// Shared navigation components for test layouts
// Requires 'use client' for: Button onClick handlers, Link interactions, Icon (hydration-sensitive)
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import Link from 'app/ui/atoms/link'

// Site logo/brand
export function SiteLogo({ variant = 'default' }) {
    return (
        <Row className="items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-primary items-center justify-center">
                <Icon icon="Zap" size={18} className="text-primary-foreground" />
            </View>
            <Text className="text-lg font-bold text-foreground">NEO</Text>
        </Row>
    )
}

// Top navigation bar for site (marketing/public pages)
export function SiteTopNav({ isAuthenticated = false }) {
    const navItems = [
        { label: 'Home', href: '/', icon: 'Home' },
        { label: 'Features', href: '/features', icon: 'Sparkles' },
        { label: 'Pricing', href: '/pricing', icon: 'CreditCard' },
        { label: 'About', href: '/about', icon: 'Info' },
    ]

    return (
        <View className="w-full h-16 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Row className="h-full max-w-7xl w-full mx-auto items-center justify-between">
                <Row className="items-center gap-8">
                    <SiteLogo />
                    <Row className="hidden md:flex gap-1">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <View className="px-3 py-2 rounded-md hover:bg-accent">
                                    <Text className="text-sm font-medium text-muted-foreground hover:text-foreground">
                                        {item.label}
                                    </Text>
                                </View>
                            </Link>
                        ))}
                    </Row>
                </Row>
                <Row className="items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            <Button variant="text" size="sm" title="" startDecorator="Bell" />
                            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                                <Icon icon="User" size={16} className="text-primary" />
                            </View>
                        </>
                    ) : (
                        <>
                            <Button variant="text" size="sm" title="Sign In" />
                            <Button variant="primary" size="sm" title="Get Started" />
                        </>
                    )}
                </Row>
            </Row>
        </View>
    )
}

// Sidebar for site (authenticated users)
export function SiteSidebar() {
    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'Feed', href: '/feed', icon: 'Newspaper' },
        { label: 'Messages', href: '/messages', icon: 'MessageCircle', badge: 3 },
        { label: 'Notifications', href: '/notifications', icon: 'Bell', badge: 12 },
        { label: 'Groups', href: '/groups', icon: 'Users' },
        { label: 'Events', href: '/events', icon: 'Calendar' },
        { label: 'Settings', href: '/settings', icon: 'Settings' },
    ]

    return (
        <View className="w-64 h-full border-r border-border bg-card py-4">
            <View className="px-4 mb-6">
                <SiteLogo />
            </View>
            <View className="px-2 gap-1">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Row className="px-3 py-2.5 rounded-lg hover:bg-accent items-center gap-3">
                            <Icon icon={item.icon} size={20} className="text-muted-foreground" />
                            <Text className="flex-1 text-sm font-medium text-foreground">{item.label}</Text>
                            {item.badge && (
                                <View className="min-w-5 h-5 rounded-full bg-primary items-center justify-center px-1.5">
                                    <Text className="text-xs font-semibold text-primary-foreground">{item.badge}</Text>
                                </View>
                            )}
                        </Row>
                    </Link>
                ))}
            </View>
        </View>
    )
}

// Top navigation bar for app (authenticated users - compact)
export function AppTopNav() {
    return (
        <View className="h-14 px-4 border-b border-border bg-card">
            <Row className="h-full items-center justify-between">
                <Row className="items-center gap-4">
                    <SiteLogo />
                    <View className="hidden md:flex h-9 w-64 px-3 rounded-lg bg-muted items-center">
                        <Icon icon="Search" size={16} className="text-muted-foreground mr-2" />
                        <Text className="text-sm text-muted-foreground">Search...</Text>
                    </View>
                </Row>
                <Row className="items-center gap-1">
                    <Button variant="text" size="sm" title="" startDecorator="Home" />
                    <Button variant="text" size="sm" title="" startDecorator="Users" />
                    <Button variant="text" size="sm" title="" startDecorator="MessageCircle" />
                    <Button variant="text" size="sm" title="" startDecorator="Bell" />
                    <View className="ml-2 w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                        <Icon icon="User" size={16} className="text-primary" />
                    </View>
                </Row>
            </Row>
        </View>
    )
}

// Sidebar for app (authenticated users - icon-focused)
export function AppSidebar({ expanded = true }) {
    const navItems = [
        { label: 'Home', href: '/', icon: 'Home' },
        { label: 'Search', href: '/search', icon: 'Search' },
        { label: 'Messages', href: '/messages', icon: 'MessageCircle', badge: 3 },
        { label: 'Notifications', href: '/notifications', icon: 'Bell', badge: 12 },
        { label: 'Create', href: '/create', icon: 'PlusSquare' },
        { label: 'Profile', href: '/profile', icon: 'User' },
    ]

    const bottomItems = [
        { label: 'Settings', href: '/settings', icon: 'Settings' },
        { label: 'Help', href: '/help', icon: 'HelpCircle' },
    ]

    const sidebarWidth = expanded ? 'w-64' : 'w-16'

    return (
        <View className={`${sidebarWidth} h-full border-r border-border bg-card py-4 flex-col`}>
            <View className={expanded ? 'px-4 mb-6' : 'px-2 mb-6 items-center'}>
                {expanded ? <SiteLogo /> : (
                    <View className="w-10 h-10 rounded-lg bg-primary items-center justify-center">
                        <Icon icon="Zap" size={20} className="text-primary-foreground" />
                    </View>
                )}
            </View>
            <View className={expanded ? 'px-2 gap-1 flex-1' : 'px-1 gap-1 flex-1 items-center'}>
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Row className={`${expanded ? 'px-3' : 'px-2 justify-center'} py-2.5 rounded-lg hover:bg-accent items-center gap-3`}>
                            <View className="relative">
                                <Icon icon={item.icon} size={22} className="text-foreground" />
                                {item.badge && !expanded && (
                                    <View className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-destructive items-center justify-center">
                                        <Text className="text-[10px] font-bold text-destructive-foreground">{item.badge}</Text>
                                    </View>
                                )}
                            </View>
                            {expanded && (
                                <>
                                    <Text className="flex-1 text-sm font-medium text-foreground">{item.label}</Text>
                                    {item.badge && (
                                        <View className="min-w-5 h-5 rounded-full bg-destructive items-center justify-center px-1.5">
                                            <Text className="text-xs font-semibold text-destructive-foreground">{item.badge}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </Row>
                    </Link>
                ))}
            </View>
            <View className={expanded ? 'px-2 gap-1 border-t border-border pt-2 mt-2' : 'px-1 gap-1 border-t border-border pt-2 mt-2 items-center'}>
                {bottomItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Row className={`${expanded ? 'px-3' : 'px-2 justify-center'} py-2.5 rounded-lg hover:bg-accent items-center gap-3`}>
                            <Icon icon={item.icon} size={22} className="text-muted-foreground" />
                            {expanded && (
                                <Text className="text-sm font-medium text-muted-foreground">{item.label}</Text>
                            )}
                        </Row>
                    </Link>
                ))}
            </View>
        </View>
    )
}


