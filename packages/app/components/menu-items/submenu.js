import { View, Row, Pressable } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { isEmoji, appSetting } from 'app/lib/util';
import { useIsDesktop } from 'app/context/measure';
import { Button, Modal } from 'app/design/controls'

export default function MenuItemSubmenu({ icon, title, pressed, disabled, addon, onPress }) {
    const isDesktop = useIsDesktop();
    const size = isDesktop ? 'base' : 'sm';
    const rounded = !isDesktop;
    //TODO FOR ANDREW
    /*
     <Pressable className='mr-1'  onPress={onPress}>
                           text
                        </Pressable>
                        */
    return (
        <Button
            startDecorator={icon}
            title={title}
            variant={pressed ? 'accent' : 'text'}
            rounded={rounded}
            pressed={pressed}
            disabled={disabled}
            size={size}
            haptics="Medium"
            addon={addon}
            onPress={onPress}
        />
    )
}