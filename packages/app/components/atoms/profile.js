import { A, Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Image from '../atoms/image';
import Link from '../atoms/link';

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
            sSize = 'w-8 h-8';
            iSizeWidth = 32;
            iSizeHeight = 32;
            break;

        case 'base':
            sSize = 'w-10 h-10';
            iSizeWidth = 40;
            iSizeHeight = 40;
            break;

        case 'lg':
            sSize = 'w-12 h-12';
            iSizeWidth = 48;
            iSizeHeight = 48;
            break;

        case 'xl':
            sSize = 'w-14 h-14';
            iSizeWidth = 56;
            iSizeHeight = 56;
            break;

        case '2xl':
            sSize = 'w-24 h-24';
            iSizeWidth = 96;
            iSizeHeight = 96;
            break;

        case '3xl':
            sSize = 'w-32 h-32';
            iSizeWidth = 128;
            iSizeHeight = 128;
            break;
    }
    sSize += ' rounded-full ';

    //--- with clickable Username (or not)
    const bShowLinks = !oProps.showLinks || oProps.showLinks === 'true';

    function DisplayNameLink(oProps) {
        return (
            <Text className="font-bold text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:underline">{oProps.title}</Text>
        );
    }

    function DisplayNameText(oProps) {
        return (
            <Text className='text-gray-700 dark:text-gray-300 text-sm font-bold tracking-tight mr-2'>{oProps.title}</Text>
        );
    }

    //--- with custom or default info section
    function DisplayInfo(oProps) {
        return (
            <View className="flex-row ">
                <Text className='mr-2 text-gray-600 dark:text-gray-400 text-sm  tracking-tight'>AU</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm  tracking-tight">Dermatology</Text>
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
                <Link haptics="Select" href={oProps.url}><View className="flex-row items-center w-full space-x-2">
                    <View className="flex-none relative">
                        <AtomProfile {...oProps} displayType="unit_wo_info"  />
                    </View>
                    <View className="flex-auto mb-auto my-auto sm:my-auto">
                        <AtomProfile {...oProps} displayType="unit_wo_image" />
                    </View>
                </View></Link>
            );
            break;
        case 'full':
            sResult = (
                <Link haptics="Select" href={oProps.url}>
                    <View className="flex-row space-x-2 ">
                        <Image className={sSize} width={iSizeWidth} height={iSizeHeight} src={oProps.url_avatar} alt={oProps.display_name} />
                        <View className=" my-auto  flex-col ">
                          <Text className="text-gray-700 hover:text-gray-900 duration-200 dark:hover:text-white dark:text-gray-300 text-base tracking-tight hover:underline font-bold">
                           <DisplayNameText title={oProps.display_name} />
                          </Text>
                          <Text className="text-gray-600 dark:text-gray-400 text-sm  ">
                              {sShowInfo}
                          </Text>
                        </View>
                  </View>
                </Link>
            );
            break;
        case 'unit_wo_info':
            //
            sResult = (
                <Link haptics="Select" href={oProps.url}><View className="relative flex-row">
                    <Image className={sSize} width={iSizeWidth} height={iSizeHeight} src={oProps.url_avatar} alt={oProps.display_name} />
                </View></Link>
            );
            break;

        case 'unit_wo_image':
            sResult = (
                <Link haptics="Select" href={oProps.url}><View className="flex-col ">
                    <View className='flex-row '>
                        <View className="">{bShowLinks ? <DisplayNameLink title={oProps.display_name} url={oProps.url} /> : <DisplayNameText title={oProps.display_name} />}</View>
                    </View>
                    <View className="flex-row items-center"><Text>{sShowInfo}</Text></View>
                </View></Link>
            );
            break;

        default:
            sResult = (
                <Link haptics="Select" href={oProps.url}><View className="relative flex-row">
                    <View className={sSize}>
                        <Text>Undefined</Text>
                    </View>
                </View></Link>
            );
    }
    return sResult;
}
