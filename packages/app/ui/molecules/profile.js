import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getRandomColor } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'

/**
 * displayType: 
 *    1. unit, 
 *    2. unit_wo_image (unit without image = username + meta info), 
 *    4. unit_wo_info (unit without info = image only)
 *    
 * displaySize: xs, sm, base, lg, xl, 2xl,3xl
 * 
 * showLinks: true, false
 * show Unit with or without a link to profile.
 * 
 * showInfo: true, false
 * show Unit with or without a meta info.
 * 
 */

export default function AtomProfile(oProps) {
    let sResult = ''
    //--- display type
    const sDisplayType = oProps.displayType
        ? oProps.displayType
        : oProps.display_type

    //--- the profile image size
    const sDisplaySize = oProps.displaySize ? oProps.displaySize : 'base'

    let sSize = ''
    let iSizeWidth = 0;
    let iSizeHeight = 0;
    let sSizeFont = '';
    let sSizeFontLetter = '';
    switch (sDisplaySize) {
        case 'xs':
            sSize = 'w-6 h-6'
            iSizeWidth = 24
            iSizeHeight = 24
            sSizeFont = 'text-xs tracking-tight font-semibold';
            sSizeFontLetter = 'text-base font-semibold';
            break

        case 'sm':
            sSize = 'w-8 h-8'
            iSizeWidth = 32
            iSizeHeight = 32
            sSizeFont = 'text-sm tracking-tighter font-semibold';
            sSizeFontLetter = 'text-base font-bold';
            break

        case 'base':
            sSize = ' w-10 h-10 '
            iSizeWidth = 40
            iSizeHeight = 40
            sSizeFont = ' text-sm leading-[22px] tracking-tight font-bold';
            sSizeFontLetter = 'text-xl font-semibold';
            break

        case 'lg':
            sSize = 'w-12 h-12'
            iSizeWidth = 56
            iSizeHeight = 56
            sSizeFont = 'text-base tracking-tight font-bold';
            sSizeFontLetter = 'text-xl font-semibold';
            break

        case 'xl':
            sSize = 'w-20 h-20'
            iSizeWidth = 80
            iSizeHeight = 80
            sSizeFont = 'text-lg tracking-tight font-semibold';
            sSizeFontLetter = 'text-xl  font-semibold';
            break

        case '2xl':
            sSize = 'w-24 h-24'
            iSizeWidth = 96
            iSizeHeight = 96
            sSizeFont = 'text-xl tracking-tight font-semibold';
            sSizeFontLetter = 'text-2xl font-semibold';
            break

        case '3xl':
            sSize = 'w-32 h-32'
            iSizeWidth = 128
            iSizeHeight = 128
            sSizeFont = 'text-2xl tracking-tight font-semibold';
            sSizeFontLetter = 'text-5xl font-semibold';
            break

        case '4xl':
            sSize = 'w-48 h-48'
            iSizeWidth = 192
            iSizeHeight = 192
            sSizeFont = 'text-3xl tracking-tight font-semibold';
            sSizeFontLetter = 'text-7xl font-semibold';
            break

        case 'full':
            sSize = ' w-full aspect-square rounded-xl '
            iSizeWidth = 400
            iSizeHeight = 400
            sSizeFont = 'text-4xl tracking-tight font-semibold';
            sSizeFontLetter = 'text-7xl font-semibold';
            break
    }
    sSize += ' rounded-full '

    let emulate = oProps.showLink ? false : true

    //--- with clickable Username (or not)
    const bShowLinks = oProps.showLinks !== false;

    function DisplayNameLink(oProps) {

        if (oProps.href && (oProps.href == 'javascript:' || oProps.href === undefined))
            oProps.href = '';

        const isAnon = !oProps.url || oProps.url == '' || oProps.url == 'javascript:' || oProps.url == '/javascript:';


        if (isAnon || oProps.title.includes("(anonymized)")) {
            return (
                <Row className={' text-neutral-900  dark:text-neutral-100 gap-x-2 items-center ' + sSizeFont}>
                    <Text className={'text-neutral-900  dark:text-neutral-100 ' + sSizeFont + ' truncate '}>
                        {oProps.title && oProps.title.replace(" (anonymized)", '')}
                    </Text>
                    <Icon icon="Detective"></Icon>
                </Row>
            )

        }

        return (
            <Text className={' text-neutral-900 dark:text-neutral-100 hover:text-linkhover ' + sSizeFont + ' truncate '}>
                {oProps.title}
            </Text>
        )
    }

    function DisplayNameText(oProps) {
        return (
            <Text className={'text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-50 ' + sSizeFont + ' tracking-tight truncate hover:underline'}>
                {oProps.title}
            </Text>
        )
    }

    //--- with custom or default info section
    function DisplayInfo(oProps) {
        return <></>
        return (
            <View className="flex-row ">
                <Text className="mr-2 text-neutral-600 dark:text-neutral-400 text-sm    tracking-tight">
                    user
                </Text>
            </View>
        )
    }

    let sShowInfo = undefined;
    if (oProps.showInfo != undefined)
        sShowInfo = oProps.showInfo !== 'false' ? oProps.showInfo : undefined;
    else
        sShowInfo = <DisplayInfo {...oProps} />

    switch (sDisplayType) {
        case 'unit':
            sResult = (
                <View className="flex-row gap-x-2 sm:gap-x-3  items-center">
                    <View className="flex-none">
                        <AtomProfile {...oProps} displayType="unit_wo_info" />
                    </View>
                    <View className="flex-auto">
                        <AtomProfile {...oProps} displayType="unit_wo_image" />
                    </View>
                </View>
            )
            break

        case 'unit_wo_info':
            let name = oProps.display_name ? oProps.display_name.substr(0, 1) : ''
            const content = <View className="relative flex-row">
                <View className={sSize + " aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-700 mx-auto rounded-full "}>
                   
                    {!oProps.url_avatar && <View className={'h-full items-center justify-center bg-' + getRandomColor(oProps.id) + '-500 uppercase'}>
                        <Text className={sSizeFontLetter + ' text-white '}>{name}</Text>
                    </View>}
                    {!!oProps.url_avatar && <Image
                        sizes="(max-width:1024px) 100vw, 1024px"
                        className={sSize + " z-50"}
                        view="cover"
                        src={oProps.url_avatar}
                        alt={oProps.display_name}
                    />
                    }
                </View>
            </View>;

            sResult = oProps.url && bShowLinks ? <Link emulate={emulate} href={oProps.url}>{content}</Link> : content
            break

        case 'unit_wo_image':
            sResult = (
                <View className="flex-col my-auto ">

                    {bShowLinks ? (
                        <Link emulate={emulate} haptics="Select" href={oProps.url}>
                            <DisplayNameLink
                                title={oProps.display_name}
                                url={oProps.url}
                            /></Link>
                    ) : (
                        <DisplayNameText title={oProps.display_name} />
                    )}

                    <View >{sShowInfo}</View>
                </View>

            )
            break

        case 'text':
            sResult = (
                <View className="flex-col my-auto">
                    {bShowLinks ? (
                        <DisplayNameLink
                            title={oProps.display_name}
                            url={oProps.url}
                        />
                    ) : (
                        <DisplayNameText title={oProps.display_name} />
                    )}
                </View>
            )
            break

        default:
            sResult = (
                <View className="relative flex-row">
                    <View className={sSize}>
                        <Text>Undefined</Text>
                    </View>
                </View>
            )
    }
    return sResult
}
