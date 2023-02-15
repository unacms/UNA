import { A, Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Image from '../atoms/image';

export default function AtomProfile(oProps) {
    let sResult = '';

    //--- display type
    const sDisplayType = oProps.displayType ? oProps.displayType : oProps.display_type;

    //--- the profile image size
    const sDisplaySize = oProps.displaySize ? oProps.displaySize : 'base';

    let sSize = '';
    let iSizeWidth = 0, iSizeHeight = 0;
    switch(sDisplaySize) {
        case 'xs':
            sSize = 'w-6 h-6';
            iSizeWidth = 24;
            iSizeHeight = 24;
            break;

        case 'sm':
            sSize = 'w-10 h-10';
            iSizeWidth = 40;
            iSizeHeight = 40;
            break;

        case 'base':
            sSize = 'w-12 h-12';
            iSizeWidth = 48;
            iSizeHeight = 48;
            break;

        case 'lg':
            sSize = 'w-14 h-14';
            iSizeWidth = 56;
            iSizeHeight = 56;
            break;

        case 'xl':
            sSize = 'w-20 h-20';
            iSizeWidth = 80;
            iSizeHeight = 80;
            break;
    }
    sSize += ' rounded-full border border-gray-500/30 ';

    //--- with clickable Username (or not)
    const bShowLinks = !oProps.showLinks || oProps.showLinks === 'true';

    function DisplayNameLink(oProps) {
        return (
            <A className="font-semibold text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:underline" href={oProps.url}>{oProps.title}</A>
        );
    }

    function DisplayNameText(oProps) {
        return (
            <Text className="text-sm text-gray-700 dark:text-gray-300">{oProps.title}</Text>
        );
    }

    //--- with custom or default info section
    function DisplayInfo(oProps) {
        return (
            <View className="bx-def-unit-info flex items-center">
                <Text className="pl-1">Dermatology</Text>
            </View>
        );
    }

    let sShowInfo = '';
    if(oProps.showInfo != undefined)
        sShowInfo = oProps.showInfo !== 'false' ? oProps.showInfo : '';
    else
        sShowInfo = <DisplayInfo {...oProps} />

    switch(sDisplayType) {
        case 'unit':
            sResult = (
                <View className="flex-row items-center w-full space-x-2">
                    <View className="flex-none relative">
                        <AtomProfile {...oProps} displayType="unit_wo_info"  />
                    </View>
                    <View className="flex-auto mb-auto mt-0.5 sm:my-auto">
                        <AtomProfile {...oProps} displayType="unit_wo_image" />
                    </View>
                </View>
            );
            break;

        case 'unit_wo_info':
            //
            sResult = (
                <View className="relative flex-row">
                    <Image className={sSize} width={iSizeWidth} height={iSizeHeight} src={oProps.url_avatar} alt={oProps.display_name} />
                </View>
            );
            break;

        case 'unit_wo_image':
            sResult = (
                <View className="flex-col ">
                    <View className='flex-row gap-x-2 gap-y-1'>
                        <View className="flex-none">{bShowLinks ? <DisplayNameLink title={oProps.display_name} url={oProps.url} /> : <DisplayNameText title={oProps.display_name} />}</View>
                    </View>
                    <View className="flex-row items-center text-gray-500 text-xs sm:inline-flex font-medium tracking-tight">
                        <View className="flex-row gap-1 font-medium tracking-tight my-auto text-xs sm:inline-flex items-center rounded-full">
                            <Text>AU</Text>
                        </View>
                        <View className='sm:inline-flex items-center text-xs'><Text>{sShowInfo}</Text></View>
                     </View>
                </View>
            );
            break;

        default:
            sResult = (
                <View className="relative flex-row">
                    <View className={sSize}>
                        <Text>Undefind</Text>
                    </View>
                </View>
            );
    }

    return sResult;
}
