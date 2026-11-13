import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import AuthPanelJs, { hasAltAuth } from 'app/ui/molecules/auth/auth'
import { appSetting } from 'app/lib/util'
import type { ComponentType } from 'react'

const AuthPanel = AuthPanelJs as ComponentType<Record<string, any>>

/** What UNA sends with the sign-in and join forms for the parts around the form (`auth` on the form's content item). */
export type AuthBlockData = {
    /** Other sign-in methods are offered in this block. */
    methods?: boolean
    /** The form is shown, so an "or" goes between it and the other methods. */
    separator?: boolean
    /** The sign-in form's "Forgot password?", for when the Password field doesn't draw it. */
    forgot?: { action?: string; url?: string } | null
    /** The line to the other form: "Don't have an account? Sign up". */
    switch?: { text?: string; action?: string; url?: string } | null
}

/**
 * The parts of a sign-in or join block under its form, inside the block as on the UNA site: the app's
 * other sign-in methods after an "or", then the link to the other form.
 */
export default function AuthBlockPart({ auth }: Readonly<{ auth?: AuthBlockData | null }>) {
    if (!auth) return null

    const showMethods = !!auth.methods && hasAltAuth()
    const link = auth.switch?.url ? auth.switch : null
    // The Password field draws the link itself (forms.sys_login.forgot_password_link); a fork that
    // empties the setting gets the centred link here instead.
    const forgot = auth.forgot?.url && !appSetting('forms', 'sys_login')?.forgot_password_link ? auth.forgot : null
    if (!showMethods && !link && !forgot) return null

    return (
        <View className="w-full gap-4 pt-4">
            {forgot ? (
                <Link className="mx-auto" variant="accent" size="sm" href={forgot.url} haptics="Medium">
                    {forgot.action}
                </Link>
            ) : null}
            {showMethods ? <AuthPanel showSeparator={auth.separator !== false} /> : null}
            {link ? (
                <Row className="mx-auto flex-wrap items-center justify-center gap-1">
                    <Text className="text-sm text-muted-foreground" accessibilityRole="text">
                        {link.text}
                    </Text>
                    <Link variant="accent" size="sm" href={link.url} haptics="Medium">
                        {link.action}
                    </Link>
                </Row>
            ) : null}
        </View>
    )
}
