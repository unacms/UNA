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

export function DisplayNameLink({ 
    title, 
    url, 
    href, 
    fontSize, 
    actions, 
    inheritColor, 
    inheritTextSize, 
    textClassName,
    link_variant,
    link_className,
    link_emulate,
    link_haptics,
    link_href,
}) {
    const ProfileLink = getComponent('molecule', 'profile_link')
    const result = ProfileLink({ title, url, href, fontSize, actions, options: { inheritColor, inheritTextSize, textClassName } })
    const link_content = Array.isArray(result) ? result[0] : result;
    const add_content = Array.isArray(result) ? result[1] : null;

    const linkCtr = link_href? <Link variant={link_variant} className={link_className} emulate={link_emulate} haptics={link_haptics} href={link_href}>{link_content}</Link> : link_content;
    const addCtr = add_content ? add_content : null;

    return addCtr ? (
        <Row className="shrink min-w-0 flex-wrap items-center gap-1">
            <View className="shrink min-w-0">{linkCtr}</View>
            <View className="shrink-0">{addCtr}</View>
        </Row>
    ) : linkCtr;
}

function DisplayNameText({ title, fontSize }) {
    return (
        <Text className={`${fontSize} whitespace-nowrap text-ellipsis overflow-hidden text-card-foreground web:hover:text-foreground`}>
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
        <View className={`${sSize} relative overflow-hidden bg-muted rounded-full `}>
            {!oProps.url_avatar && <View className={'h-full items-center justify-center bg-' + (oProps.id? getRandomColor(oProps.id)+'-500': 'primary/50') + ' uppercase'}>
                <Text className={sSizeFontLetter + ' text-card '}>{name}</Text>
            </View>}
            {!!oProps.url_avatar && <Image
                sizes={iSizeWidth + "px"}
                className={sSize}
                view="cover"
                width={iSizeWidth}
                src={oProps.url_avatar}
                alt={oProps.display_name}
            />
            }
            <View
                pointerEvents="none"
                className="absolute inset-0 rounded-full shadow-avatar dark:shadow-avatar-deep"
            />
        </View>
        ;

    // Build the linked avatar
    const linkedAvatar = oProps.url && bShowLinks && !hoverCardWrapper
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
        oProps.url != 'javascript:' && oProps.url != '/javascript:' ? (
            
                <DisplayNameLink
                    title={oProps.display_name}
                    url={oProps.url}
                    fontSize={sSizeFont}
                    href={oProps.href}
                    link_variant="default" 
                    link_className="flex flex-row items-center shrink min-w-0 overflow-hidden" 
                    link_emulate={emulate} 
                    link_haptics="Select" 
                    link_href={oProps.url}
                />
            ) : <DisplayNameLink
            title={oProps.display_name}
            url={oProps.url}
            fontSize={sSizeFont}
            href={oProps.href}
        />
    ) : (
        <DisplayNameText title={oProps.display_name} fontSize={sSizeFont} />
    );

    return (
        <Row className="my-auto flex-1 min-w-0 items-center">
            <View className="flex-1 min-w-0">
                <Row className="flex-1 min-w-0 items-center gap-1 min-h-6">
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

function UnitTextLink({ oProps, sSizeFont, emulate }) {
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

    // Get size from settings with fallback
    const sizeConfig = appSetting('theme', 'profile_sizes', sDisplaySize)

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
                <Row className="gap-2 items-center flex-1 min-w-0">
                    <View className="flex-none">
                        <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} hoverCardWrapper={hoverCardWrapper} />
                    </View>
                    <View className="flex-auto min-w-0">
                        <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} info2={sShowInfo2} actions={oProps.showActions} hoverCardWrapper={hoverCardWrapper} />
                    </View>
                </Row>
            )

        case 'unit_wo_info':
            return <UnitWoInfo oProps={oProps} sSize={sSize} sSizeFontLetter={sSizeFontLetter} emulate={emulate} iSizeWidth={iSizeWidth} bShowLinks={bShowLinks} hoverCardWrapper={hoverCardWrapper} />

        case 'unit_wo_image':
            return <UnitWoImage oProps={oProps} sSizeFont={sSizeFont} bShowLinks={bShowLinks} emulate={emulate} info={sShowInfo} info2={sShowInfo2} actions={oProps.showActions} hoverCardWrapper={hoverCardWrapper} />

        case 'unit_text':
            return <UnitText oProps={oProps} sSizeFont={sSizeFont} />

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