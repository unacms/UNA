import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getRandomColor, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { memo } from 'react';
import { getPart } from 'app/lib/parts/part';
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

export function DisplayNameLink({title, url, href, fontSize, actions}) {
    return getPart("ProfileDisplayNameLink", [title, url, href, fontSize, actions])
}

function DisplayNameText({ title, fontSize }) {
    return (
        <Text className={'text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-white ' + fontSize + '  font-semibold tracking-tight truncate '}>
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
    const content = 
        <View className={`${sSize} overflow-hidden bg-bgritem dark:bg-bgritem-d rounded-full`}>
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
;

    return oProps.url && bShowLinks ? <Link emulate={emulate} href={oProps.url}>{content}</Link> : content

}

function UnitWoImage({ oProps, bShowLinks, emulate, info, sSizeFont, actions }) {
    return (
        <View className="flex-col my-auto">

            {bShowLinks ? (
                <Link emulate={emulate} haptics="Select" href={oProps.url}>
                    <DisplayNameLink
                        title={oProps.display_name}
                        url={oProps.url}
                        fontSize={sSizeFont}
                        href={oProps.href}
                        actions={actions}
                    /></Link>
            ) : (
                <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} />
            )}

            <View>{info}</View>
        </View>

    )
}

function UnitText({ oProps, sSizeFont }) {
    return (
        <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} />

    )
}

function UnitTextLink({ oProps, sSizeFont,  emulate }) {
    return (
        <Link emulate={emulate} haptics="Select" href={oProps.url}>
                    <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} /></Link>

    )
}

function AtomProfile_(oProps) {
    //--- display type
    const sDisplayType = oProps.displayType
        ? oProps.displayType
        : (oProps.display_type ? oProps.display_type : 'unit')

    //--- the profile image size
    const sDisplaySize = oProps.displaySize ? oProps.displaySize : 'base'

    const sizes = {
        xxs: {
            sSize: 'w-[20px] h-[20px]',
            iSizeWidth: 20,
            iSizeHeight: 20,
            sSizeFont: 'text-[12px]', 
            sSizeFontLetter: 'text-base font-semibold',
        },
        xs: {
            sSize: 'w-[24px] h-[24px]',
            iSizeWidth: 24,
            iSizeHeight: 24,
            sSizeFont: 'text-[12px]', 
            sSizeFontLetter: 'text-base font-semibold',
        },
        sm: {
            sSize: 'w-[36px] h-[36px]',
            iSizeWidth: 36,
            iSizeHeight: 36,
            sSizeFont: 'native:text-[14px] web:text-sm',
            sSizeFontLetter: 'text-base opacity-50 font-semibold',
        },
        base: {
            sSize: 'w-[40px] h-[40px]',
            iSizeWidth: 40,
            iSizeHeight: 40,
            sSizeFont: ' text-[14px] leading-[20px] tracking-tight font-semibold ',
            sSizeFontLetter: ' p-[8px] text-center text-[20px] font-semibold',
        },
        lg: {
            sSize: 'w-[48px] h-[48px]',
            iSizeWidth: 48,
            iSizeHeight: 48,
            sSizeFont: 'text-[16px] leading-[24px]',
            sSizeFontLetter: 'text-3xl font-semibold',
        },
        xl: {
            sSize: 'w-[64px] h-[64px]',
            iSizeWidth: 64,
            iSizeHeight: 64,
            sSizeFont: 'text-lg',
            sSizeFontLetter: 'text-4xl opacity-50 font-semibold',
        },
        '1.5xl': {
            sSize: 'w-[72px] h-[72px]',
            iSizeWidth: 72,
            iSizeHeight: 72,
            sSizeFont: 'text-xl',
            sSizeFontLetter: 'text-2xl',
        },
        '2xl': {
            sSize: 'w-[96px] h-[96px]',
            iSizeWidth: 96,
            iSizeHeight: 96,
            sSizeFont: 'text-xl',
            sSizeFontLetter: 'text-2xl',
        },
        '3xl': {
            sSize: 'w-[128px] h-[128px]',
            iSizeWidth: 128,
            iSizeHeight: 128,
            sSizeFont: 'text-2xl',
            sSizeFontLetter: 'text-5xl',
        },
        '4xl': {
            sSize: 'w-[176px] h-[176px]',
            iSizeWidth: 176,
            iSizeHeight: 176,
            sSizeFont: 'text-3xl',
            sSizeFontLetter: 'text-7xl',
        },
        full: {
            sSize: 'w-[256px] h-[256px]',
            iSizeWidth: 256,
            iSizeHeight: 256,
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
                <Row className="gap-x-[8px] items-center">
                    <View className="flex-none mb-auto">
                        <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} />
                    </View>
                    <View className="flex-auto">
                        <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} actions={oProps.showActions} />
                    </View>
                </Row>
            )

        case 'unit_wo_info':
            return <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} />

        case 'unit_wo_image':
            return <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} actions={oProps.showActions} />

        case 'unit_text':
            return <UnitText oProps={oProps} sSizeFont={sSizeFont}  />

        case 'unit_text_link':
                return <UnitTextLink oProps={oProps} sSizeFont={sSizeFont} emulate={emulate} />
    

        case 'text':
            return (
                <View className="flex-col my-auto">
                    {bShowLinks ? (
                        <DisplayNameLink
                            title={oProps.display_name}
                            url={oProps.url}
                            fontSize={sSizeFont}
                            href={oProps.href}
                            actions={oProps.showActions}
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