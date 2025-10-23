import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getRandomColor } from 'app/lib/util';
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

export function DisplayNameLink({title, url, href, fontSize, actions, inheritColor, inheritTextSize, textClassName}) {
    return getPart("ProfileDisplayNameLink", [title, url, href, fontSize, actions, { inheritColor, inheritTextSize, textClassName }])
}

function DisplayNameText({ title, fontSize }) {
    return (
        <Text className={fontSize + 'truncate tracking-tight'}>
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
        <View className={`${sSize} overflow-hidden bg-secondary rounded-full`}>
            {!oProps.url_avatar && <View className={'h-full items-center justify-center bg-' + getRandomColor(oProps.id) + '-500 uppercase'}>
                <Text className={sSizeFontLetter + ' text-white '}>{name}</Text>
            </View>}
            {!!oProps.url_avatar && <Image
                sizes={iSizeWidth + "px"}
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

function UnitWoImage({ oProps, bShowLinks, emulate, info, sSizeFont, actions, info2 }) {
    return (
       <Row className="justify-between">
       <View className="my-auto gap-0.5">

            {bShowLinks ? (
                <Row className="items-center gap-1 items-center min-h-5">
                    <Link variant="ghost" size="sm" emulate={emulate} haptics="Select"  href={oProps.url}>
                        <DisplayNameLink
                            title={oProps.display_name}
                            url={oProps.url}
                            fontSize={sSizeFont}
                            href={oProps.href}
                            inheritColor
                            inheritTextSize
                        />
                    </Link>
                    {info2}
                   
                </Row>
            ) : (
                <Row className="items-center gap-1">
                    <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} />
                    {info2}
                </Row>
            )}

            {info}
        </View>
            <Row className="flex-none mb-auto">
                {actions}
            </Row>
        </Row>
      
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
        '2xs': {
            sSize: 'w-5 h-5',
            iSizeWidth: 20,
            iSizeHeight: 20,
            sSizeFont: 'text-xs leading-5', 
            sSizeFontLetter: ' text-xs font-semibold',
        },
        xs: {
            sSize: 'w-7 h-7',
            iSizeWidth: 28,
            iSizeHeight: 28,
            sSizeFont: 'text-xs leading-5', 
            sSizeFontLetter: ' text-sm font-semibold',
        },
        sm: {
            sSize: 'w-9 h-9',
            iSizeWidth: 36,
            iSizeHeight: 36,
            sSizeFont: 'text-sm leading-4 tracking-tight font-semibold',
            sSizeFontLetter: ' text-base opacity-50 font-semibold',
        },
        base: {
            sSize: 'w-10 h-10',
            iSizeWidth: 40,
            iSizeHeight: 40,
            sSizeFont: '  ',
            sSizeFontLetter: ' p-2 text-center text-xl font-semibold',
        },
        lg: {
            sSize: 'w-11 h-11',
            iSizeWidth: 44,
            iSizeHeight: 44,
            sSizeFont: ' text-lg leading-6 tracking-tight font-semibold',
            sSizeFontLetter: 'text-3xl font-semibold',
        },
        xl: {
            sSize: 'w-16 h-16',
            iSizeWidth: 64,
            iSizeHeight: 64,
            sSizeFont: 'text-xl',
            sSizeFontLetter: 'text-4xl opacity-50 font-semibold',
        },
        '1.5xl': {
            sSize: 'w-18 h-18',
            iSizeWidth: 72,
            iSizeHeight: 72,
            sSizeFont: 'text-xl',
            sSizeFontLetter: 'text-5xl',
        },
        '2xl': {
            sSize: 'w-24 h-24',
            iSizeWidth: 96,
            iSizeHeight: 96,
            sSizeFont: 'text-xl',
            sSizeFontLetter: 'text-6xl',
        },
        '3xl': {
            sSize: 'w-32 h-32',
            iSizeWidth: 128,
            iSizeHeight: 128,
            sSizeFont: 'text-2xl',
            sSizeFontLetter: 'text-5xl',
        },
        '4xl': {
            sSize: 'w-40 h-40',
            iSizeWidth: 160,
            iSizeHeight: 160,
            sSizeFont: 'text-3xl',
            sSizeFontLetter: 'text-7xl',
        },
        full: {
            sSize: 'w-64 h-64',
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

    const sShowInfo2 = oProps.showInfo2

    switch (sDisplayType) {
        case 'unit':
            return (
                <Row className="gap-2 items-center">
                    <View className="flex-none">
                        <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} />
                    </View>
                    <View className="flex-auto">
                        <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} info2={sShowInfo2} actions={oProps.showActions} />
                    </View>
                </Row>
            )

        case 'unit_wo_info':
            return <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} />

        case 'unit_wo_image':
            return <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} info2={sShowInfo2} actions={oProps.showActions} />

        case 'unit_text':
            return <UnitText oProps={oProps} sSizeFont={sSizeFont}  />

        case 'unit_text_link':
                return <UnitTextLink oProps={oProps} sSizeFont={sSizeFont} emulate={emulate} />
    

        case 'text':
            return (
                <View className="flex-col my-auto flex-auto">
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