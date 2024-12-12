import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getRandomColor, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import { memo } from 'react';
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

function DisplayNameLink({ title, url, href, fontSize }) {

    if (href && (href == 'javascript:' || href === undefined))
        href = '';

    const isAnon = !url || url == '' || url == 'javascript:' || url == '/javascript:';

    if (isAnon || title.includes("(anonymized)")) {
        return (
            <Row className={' text-neutral-900  dark:text-neutral-100 gap-x-2 items-center ' + fontSize}>
                <Text className={'text-neutral-900 dark:text-neutral-100 font-semibold ' + fontSize + ' truncate '}>
                    {title && title.replace(" (anonymized)", '')} (protected)
                </Text>
                <Icon icon="ShieldCheckered"/>
            </Row>
        )

    }

    return (
        <Text className={'text-neutral-900 dark:text-neutral-100 hover:text-linkhover font-semibold ' + fontSize + ' truncate '}>
            {title}
        </Text>
    )
}

function DisplayNameText({ title, fontSize }) {
    return (
        <Text className={'text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-50 ' + fontSize + ' tracking-tight truncate hover:underline'}>
            {title}
        </Text>
    )
}

//--- with custom or default info section
function DisplayInfo(oProps) {
    return <></>
}

function UnitWoInfo({ oProps, sSize, sSizeFontLetter, iSizeWidth, bShowLinks, emulate }) {
    let name = oProps.display_name ? oProps.display_name.substr(0, 1) : ''
    const content = <View className="relative flex-row">
        <View className={sSize + " hover:animate-pulse overflow-hidden bg-bgritem dark:bg-bgritem-d  mx-auto rounded-full "}>
            {!oProps.url_avatar && <View className={'h-full items-center justify-center bg-' + getRandomColor(oProps.id) + '-500 uppercase'}>
                <Text className={sSizeFontLetter + ' text-white '}>{name}</Text>
            </View>}
            {!!oProps.url_avatar && <Image
                sizes={LAYOUT_BREAKPOINTS.lg}
                className={sSize + " z-50"}
                view="cover"
                width={iSizeWidth}
                src={oProps.url_avatar}
                alt={oProps.display_name}
            />
            }
        </View>
    </View>;

    return oProps.url && bShowLinks ? <Link emulate={emulate} href={oProps.url}>{content}</Link> : content

}

function UnitWoImage({ oProps, bShowLinks, emulate, info, sSizeFont }) {
    return (
        <View className="flex-col my-auto ">

            {bShowLinks ? (
                <Link emulate={emulate} haptics="Select" href={oProps.url}>
                    <DisplayNameLink
                        title={oProps.display_name}
                        url={oProps.url}
                        fontSize={sSizeFont}
                        href={oProps.href}
                    /></Link>
            ) : (
                <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} />
            )}

            <View>{info}</View>
        </View>

    )
}

function AtomProfile_(oProps) {
    //--- display type
    const sDisplayType = oProps.displayType
        ? oProps.displayType
        : oProps.display_type

    //--- the profile image size
    const sDisplaySize = oProps.displaySize ? oProps.displaySize : 'base'

    /* let sSize = ''
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
             sSizeFont = 'text-sm tracking-tight font-semibold';
             sSizeFontLetter = 'text-base font-bold';
             break
 
         case 'base':
             sSize = ' w-11 h-11 '
             iSizeWidth = 44
             iSizeHeight = 44
             sSizeFont = ' text-sm leading-4 tracking-tight font-bold ';
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
     }*/
    const sizes = {
        xs: {
            sSize: 'w-6 h-6',
            iSizeWidth: 24,
            iSizeHeight: 24,
            sSizeFont: 'text-xs',
            sSizeFontLetter: 'text-base',
        },
        sm: {
            sSize: 'w-8 h-8',
            iSizeWidth: 32,
            iSizeHeight: 32,
            sSizeFont: 'text-sm',
            sSizeFontLetter: 'text-base',
        },
        base: {
            sSize: 'w-10 h-10',
            iSizeWidth: 40,
            iSizeHeight: 40,
            sSizeFont: 'text-sm',
            sSizeFontLetter: 'text-2xl opacity-50 font-semibold',
        },
        lg: {
            sSize: 'w-12 h-12',
            iSizeWidth: 48,
            iSizeHeight: 48,
            sSizeFont: 'text-base',
            sSizeFontLetter: 'text-3xl opacity-50 font-semibold',
        },
        xl: {
            sSize: 'w-16 h-16',
            iSizeWidth: 64,
            iSizeHeight: 64,
            sSizeFont: 'text-lg',
            sSizeFontLetter: 'text-4xl opacity-50 font-semibold',
        },
        '2xl': {
            sSize: 'w-24 h-24',
            iSizeWidth: 96,
            iSizeHeight: 96,
            sSizeFont: 'text-xl',
            sSizeFontLetter: 'text-2xl',
        },
        '3xl': {
            sSize: 'w-32 h-32',
            iSizeWidth: 128,
            iSizeHeight: 128,
            sSizeFont: 'text-2xl',
            sSizeFontLetter: 'text-5xl',
        },
        '4xl': {
            sSize: 'w-44 h-44',
            iSizeWidth: 176,
            iSizeHeight: 176,
            sSizeFont: 'text-3xl',
            sSizeFontLetter: 'text-7xl',
        },
        full: {
            sSize: 'w-full',
            iSizeWidth: 400,
            iSizeHeight: 400,
            sSizeFont: 'text-4xl',
            sSizeFontLetter: 'text-7xl',
        },
    };
    let { sSize, iSizeWidth, iSizeHeight, sSizeFont, sSizeFontLetter } = sizes[sDisplaySize] || sizes.base;

    sSize += ' rounded-full '

    let emulate = oProps.showLink ? false : true

    //--- with clickable Username (or not)
    const bShowLinks = oProps.showLinks !== false;

    const sShowInfo = oProps.showInfo !== undefined && oProps.showInfo !== 'false'
        ? oProps.showInfo
        : <DisplayInfo {...oProps} />;

    switch (sDisplayType) {
        case 'unit':
            return (
                <Row className="flex-row gap-x-2 sm:gap-x-3 items-center ">
                    <View className="flex-none mb-auto">
                        <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} />
                    </View>
                    <View className="flex-auto">
                        <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} />
                    </View>
                </Row>
            )

        case 'unit_wo_info':
            return <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} />

        case 'unit_wo_image':
            return <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} />

        case 'text':
            return (
                <View className="flex-col my-auto">
                    {bShowLinks ? (
                        <DisplayNameLink
                            title={oProps.display_name}
                            url={oProps.url}
                            fontSize={sSizeFont}
                            href={oProps.href}
                        />
                    ) : (
                        <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} />
                    )}
                </View>
            )

        default:
            return (
                <View className="relative flex-row">
                    <View className={sSize}>
                        <Text>Undefined</Text>
                    </View>
                </View>
            )
    }

}

export default memo(AtomProfile_);