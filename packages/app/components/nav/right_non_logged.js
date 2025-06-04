import { View, Row, Pressable } from 'app/design/view';
import Search from 'app/ui/molecules/search';
import { Text } from 'app/design/typography'
import { FeedbackHaptics } from 'app/lib/util';
import MenuLauncher from 'app/components/nav/menu-launcher'
import { Button, ButtonRef } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { appSetting } from 'app/lib/util'

export default function RightNonLogged(props) {
    const bSearch = appSetting('layout', 'search') == true
    return (
        <Row className=' gap-x-2'>
            {bSearch && <Search
                params={{ trigger: { icon: 'Search', size: 'base', variant: 'secondary', onPress: () => FeedbackHaptics('Medium') } }} />
            }
            <MenuLauncher />
            <Link href="/login">
                <ButtonRef
                    variant="secondary"
                    tooltip="Account"
                    rounded
                    size="base"
                    hitSlop={4}
                    aria-label="Account"

                    startDecorator="UserRound"
                />
            </Link>
        </Row>
    )
}