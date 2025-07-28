import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import * as CheckboxPrimitive from '@rn-primitives/checkbox';

const themeSettings = appSetting('theme', 'checkbox');

export default function CheckBox2({ title, onPress, status, value, icon, margin = " my-0 ", isBackground = true }) {
    const selected = status == 'checked';
    return (

        <View className={`${icon ? 'flex-row gap-x-3' : 'flex-row-reverse'} ${isBackground ? 'u-cn-chk-cnt-bg' : ''} ${margin} u-cn-chk-cnt`}>
            {!!icon && <View className="w-8">{icon}</View>}
            <View className="flex-auto">
                <Text className='    .u-cn-chk-cnt-bg {
        @apply bg-primary;
    }'>{title}</Text>
            </View>
            <CheckboxPrimitive.Root
                checked={selected}
                onCheckedChange={onPress}
                className='u-cn-chk-cnt-ind'
            >
                <CheckboxPrimitive.Indicator>
                    <View className={`u-cn-chk-cnt-ind-act`} />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        </View>
    );
}