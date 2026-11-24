import { Text } from 'app/design/typography'
import { View } from 'app/design/view'

export default function CounterIndicator({addon, isTitle}) {
    let sButtonAddonText = "";
    let sButtonAddonBg = "bg-accent";
    let sButtonAddonTextColor = "text-accent-foreground";
    if (typeof addon === 'object') {
        sButtonAddonText = addon?.text;
        if (addon?.hideZero && sButtonAddonText == '0')
            return null;
        if (addon?.variant == 'primary') {
            sButtonAddonBg = ' bg-destructive ';
            sButtonAddonTextColor = 'text-destructive-foreground';
        }
        // A count next to a menu item's title (the member's own menu): the site's quiet capsule, which darkens with
        // the row's hover.
        else if (addon?.variant == 'neutral') {
            sButtonAddonBg = 'bg-muted/50 web:group-hover:bg-muted';
            sButtonAddonTextColor = 'text-muted-foreground web:group-hover:text-foreground';
        }
    }
    else {
        sButtonAddonText = addon;
    }

    const position = addon?.position == 'bottom' ? 'bottom-0 -right-1' : ' top-[50%] -translate-y-6 translate-x-0.5 start-[50%] ';

    if (!isTitle && sButtonAddonText)
        return <View className={`absolute ${sButtonAddonBg} z-20 border-2 border-cardrounded-full px-1 items-center justify-center ${position}`}><Text className={`${sButtonAddonTextColor} text-xs font-semibold`}>{sButtonAddonText}</Text></View>

    return sButtonAddonText ? <View className='flex-none items-end '>
        <View className={sButtonAddonBg + ' rounded-full px-2 py-0.5 text-center items-center'}>
            <Text className={`${sButtonAddonTextColor} text-xs ${addon?.variant == 'neutral' ? 'font-medium' : 'font-semibold'}`}>{sButtonAddonText}</Text></View></View> : null;
}