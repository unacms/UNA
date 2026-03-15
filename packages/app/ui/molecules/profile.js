import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getRandomColor, appSetting } from 'app/lib/util';
import { memo } from 'react';
import { getComponent } from 'app/components/registry';
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
    const ProfileLink = getComponent('molecule', 'profile_link')
    return <ProfileLink 
        title={title} 
        url={url} 
        href={href} 
        fontSize={fontSize} 
        actions={actions} 
        options={{ inheritColor, inheritTextSize, textClassName }}
    />
}

function DisplayNameText({ title, fontSize }) {
    return (
        <Text className={`${fontSize} whitespace-nowrap text-ellipsis overflow-hidden`}>
            {title}
        </Text>
    )
}

//--- with custom or default info section
function DisplayInfo(oProps) {
    return <></>
}

function UnitWoInfo({ oProps, sSize, sSizeFontLetter, iSizeWidth, bShowLinks, emulate, hoverCardWrapper }) {
    let name = oProps.display_name ? oProps.display_name.substr(0, 1) : ''
    const avatarContent = 
        <View className={`${sSize} overflow-hidden bg-muted rounded-full `}>
            {!oProps.url_avatar && <View className={'h-full items-center justify-center bg-' + getRandomColor(oProps.id) + '-500 uppercase'}>
                <Text className={sSizeFontLetter + ' text-card '}>{name}</Text>
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

    // Build the linked avatar
    const linkedAvatar = oProps.url && bShowLinks 
        ? <Link emulate={emulate} href={oProps.url}>{avatarContent}</Link> 
        : avatarContent;

    // Wrap with hover card if provided
    if (hoverCardWrapper) {
        return hoverCardWrapper(linkedAvatar);
    }
    return linkedAvatar;
}

function UnitWoImage({ oProps, bShowLinks, emulate, info, sSizeFont, actions, info2, hoverCardWrapper }) {
    // Wrapper function that either wraps with hover card or returns as-is
    const wrapWithHoverCard = (content) => {
        if (hoverCardWrapper) {
            return hoverCardWrapper(content);
        }
        return content;
    };

    const nameLink = bShowLinks ? (
        <Link variant="default" className="flex-row items-center" emulate={emulate} haptics="Select" href={oProps.url}>
            <DisplayNameLink
                title={oProps.display_name}
                url={oProps.url}
                fontSize={sSizeFont}
                href={oProps.href}
                inheritColor
            />
        </Link>
    ) : (
        <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} />
    );

    return (
        <Row className="my-auto flex-1 ">
            <View className="flex-1 gap-0.5">
            <Row className="items-center gap-1 h-5">
                {wrapWithHoverCard(nameLink)}
                {info2}
                
            </Row>
            {info}
            </View>
            {actions}
        </Row>
    );
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

// Fallback sizes in case settings are not available
const fallbackSizes = {
    '3xs': { container: 'w-4 h-4', width: 16, height: 16, font: 'text-[10px] leading-4', letter_font: 'text-[8px] font-semibold' },
    '2xs': { container: 'w-5 h-5', width: 20, height: 20, font: 'text-xs leading-5', letter_font: 'text-[10px] font-semibold' },
    xs: { container: 'w-6 h-6', width: 24, height: 24, font: 'text-xs leading-5', letter_font: 'text-xs font-semibold' },
    sm: { container: 'w-8 h-8', width: 32, height: 32, font: 'text-sm leading-4 tracking-tight font-semibold', letter_font: 'text-sm font-semibold' },
    md: { container: 'w-9 h-9', width: 36, height: 36, font: 'text-sm leading-5 tracking-tight font-semibold', letter_font: 'text-base font-semibold' },
    base: { container: 'w-10 h-10', width: 40, height: 40, font: 'text-base', letter_font: 'text-lg font-semibold' },
    lg: { container: 'w-12 h-12', width: 48, height: 48, font: 'text-lg leading-6 tracking-tight font-semibold', letter_font: 'text-xl font-semibold' },
    xl: { container: 'w-14 h-14', width: 56, height: 56, font: 'text-xl', letter_font: 'text-2xl font-semibold' },
    '2xl': { container: 'w-20 h-20', width: 80, height: 80, font: 'text-xl', letter_font: 'text-3xl font-semibold' },
    '3xl': { container: 'w-40 h-40', width: 160, height: 160, font: 'text-2xl', letter_font: 'text-5xl font-semibold' },
    '4xl': { container: 'w-80 h-80', width: 320, height: 320, font: 'text-4xl', letter_font: 'text-8xl font-semibold' },
};

/**
 * Get profile size configuration from settings or fallback
 * @param {string} sizeName - Size name (e.g., 'xs', 'sm', 'base', 'lg')
 * @returns {object} Size configuration with container, width, height, font, letter_font
 */
export function getProfileSize(sizeName) {
    const settingsSize = appSetting('theme', 'profile_sizes', sizeName);
    return settingsSize || fallbackSizes[sizeName] || fallbackSizes.base;
}

function AtomProfile_(oProps) {
    //--- display type
    const sDisplayType = oProps.displayType
        ? oProps.displayType
        : (oProps.display_type ? oProps.display_type : 'unit')

    //--- the profile image size
    const sDisplaySize = oProps.displaySize ? oProps.displaySize : 'base'

    // Get size from settings with fallback
    const sizeConfig = getProfileSize(sDisplaySize);
    
    // Map to internal variable names for backward compatibility
    let sSize = sizeConfig.container;
    const iSizeWidth = sizeConfig.width;
    const iSizeHeight = sizeConfig.height;
    const sSizeFont = sizeConfig.font;
    const sSizeFontLetter = sizeConfig.letter_font;

    sSize += ' rounded-full '

    let emulate = oProps.showLink ? false : true

    //--- with clickable Username (or not)
    const bShowLinks = oProps.showLinks !== false;

    const sShowInfo = oProps.showInfo !== undefined && oProps.showInfo !== 'false'
        ? oProps.showInfo
        : <DisplayInfo {...oProps} />;

    const sShowInfo2 = oProps.showInfo2

    // Hover card wrapper function passed from parent
    const hoverCardWrapper = oProps.hoverCardWrapper;

    switch (sDisplayType) {
        case 'unit':
            return (
                <Row className="gap-2 ">
                    <View className="flex-none">
                        <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} hoverCardWrapper={hoverCardWrapper} />
                    </View>
                    <View className="flex-auto">
                        <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} info2={sShowInfo2} actions={oProps.showActions} hoverCardWrapper={hoverCardWrapper} />
                    </View>
                </Row>
            )

        case 'unit_wo_info':
            return <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} hoverCardWrapper={hoverCardWrapper} />

        case 'unit_wo_image':
            return <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} info2={sShowInfo2} actions={oProps.showActions} hoverCardWrapper={hoverCardWrapper} />

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