import { Text } from 'app/design/typography'
import { View } from 'app/design/view'

export default function CounterIndicator({addon, isTitle}) {
    let sButtonAddonText = "";
    let sButtonAddonBg = "bg-secondary";
    if (typeof addon === 'object') {
        sButtonAddonText = addon?.text;
        if (addon?.hideZero && sButtonAddonText == '0')
            return null;
        if (addon?.variant == 'primary')
            sButtonAddonBg = ' bg-destructive ';
    }
    else {
        sButtonAddonText = addon;
    }

    const position = addon?.position == 'bottom' ? 'bottom-0 -right-1' : ' top-[50%] -translate-y-6 translate-x-0.5 start-[50%] ';

    if (!isTitle && sButtonAddonText)
        return <View className={`absolute ${sButtonAddonBg} z-20 border-2 border-white dark:border-neutral-900 rounded-full px-1 items-center justify-center ${position}`}><Text className='text-white text-xs font-semibold'>{sButtonAddonText}</Text></View>

    return sButtonAddonText ? <View className='flex-1 items-end '>
        <View className={sButtonAddonBg + ' rounded-full px-2 py-0.5 text-center items-center'}>
            <Text className=" text-white text-xs font-semibold">{sButtonAddonText}</Text></View></View> : null;
}