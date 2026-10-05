import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { NeoButtonLink } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import Link from 'app/ui/atoms/link'
import { appSetting } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from 'app/ui/molecules/page/card'

// Fallback descriptions for the profile types UNA ships. A module can describe its own type
// (in any language) through the menu item's `info`, which takes precedence; types with
// neither show their title only.
const PROFILE_TYPE_HINTS = [
    [/persons?/, 'For yourself, with your own feed and connections.'],
    [/organi[sz]ation/, 'For a company, team or community you run.'],
]

function profileTypeHint(item) {
    if (typeof item.info === 'string' && item.info.trim()) return item.info.trim()
    const key = `${item.name || ''} ${item.link || ''}`
    const hint = PROFILE_TYPE_HINTS.find(([pattern]) => pattern.test(key))?.[1]
    return hint ? { key: hint } : null
}

function ProfileTypeRow({ item }) {
    const { t } = useTranslation()
    let href = item.link || ''
    if (href && !href.startsWith('/') && !/^https?:/.test(href)) href = '/' + href
    // UNA icons may carry a FontAwesome style prefix ("far user").
    const icon = (item.icon || 'UserPlus').replace(/^(far|fas|fab)\s+/, '')
    const hint = profileTypeHint(item)
    // UNA's `info` arrives translated; only NEO's own fallbacks go through t().
    const hintText = typeof hint === 'string' ? hint : hint ? t(hint.key) : null

    return (
        <Link href={href} mode="plain" haptics="Light" alt={t(item.title)} className="w-full">
            <Row className="w-full items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 web:hover:bg-muted/60 web:transition-colors">
                <View className="size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon icon={icon} size={20} className="text-primary" />
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-base font-semibold text-card-foreground">{t(item.title)}</Text>
                    {hintText ? <Text className="text-sm text-muted-foreground">{hintText}</Text> : null}
                </View>
                <Icon icon="ChevronRight" size={18} className="shrink-0 text-muted-foreground" />
            </Row>
        </Link>
    )
}

/**
 * Shown instead of the page while the signed-in account has no profile yet
 * (layout `lock_no_profile`). One row per profile type from UNA's `sys_add_profile` menu.
 * Same frame as the email confirmation lock, so both onboarding steps look alike.
 */
export default function ElementCreateProfile({ items = [] }) {
    const { t } = useTranslation()

    return (
        <View className={`${appSetting('layout', 'page_content_width_default')} ${appSetting('layout', 'page_content_padding_default')} lg:flex-row mx-auto my-auto`}>
            <View className="max-w-xl w-full flex-auto mx-auto py-4 sm:p-8 my-auto gap-y-4">
                <Card padding="p-4 sm:p-6 gap-5 sm:gap-6">
                    <CardHeader className="items-center">
                        <View className="mb-2 size-12 items-center justify-center rounded-full bg-primary/10">
                            <Icon icon="UserPlus" size={24} className="text-primary" />
                        </View>
                        <CardTitle className="text-center text-xl font-semibold text-card-foreground">{t('Create your profile')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('Your account doesn’t have a profile yet. Choose a profile type to get started.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="gap-3">
                        {items.map((item, index) => (
                            <ProfileTypeRow key={item.name || item.link || index} item={item} />
                        ))}
                    </CardContent>
                </Card>
                <View className="items-center">
                    <NeoButtonLink href="/logout" label={t('Sign out')} style="borderless" controlSize="regular" />
                </View>
            </View>
        </View>
    )
}
