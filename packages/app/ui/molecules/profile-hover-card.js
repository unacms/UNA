import { memo, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { HoverCard, HoverCardTrigger, HoverCardContent } from 'app/ui/atoms/hover-card';
import Profile from 'app/ui/molecules/profile';
import Link from 'app/ui/atoms/link';
import { getPageData } from 'app/lib/util';
import {
    CoverMenuMeta,
    CoverMenu,
    CoverMenuMore,
} from 'app/components/nav/menu-cover'

const isWeb = Platform.OS === 'web';

/**
 * Simple static content - no data fetching to avoid re-renders
 */
const ProfileCardContent = memo(function ProfileCardContent({ profileData,  pageData}) {
    const displayName = profileData?.display_name || '';
    const avatarUrl = profileData?.url_avatar;
    const profileUrl = profileData?.url;

    



    return (
            <View className="p-2">
                <Row className="gap-3 items-start">
                    <View className="flex-none">
                        <Profile
                            {...profileData}
                            url_avatar={avatarUrl}
                            display_name={displayName}
                            displayType="unit_wo_info"
                            displaySize="xl"
                            showLinks={false}
                        />
                    </View>
                    <View className="flex-1 gap-1">
                        <Link href={profileUrl} emulate={true}>
                            <Text className="text-base font-bold text-foreground hover:text-primary">
                                {displayName}
                            </Text>
                        </Link>
                        <Text className='text-xs' numberOfLines={2}>{pageData?.data?.description}</Text>
                    </View>
                </Row>
                <View className="my-2 gap-y-2">
                    {!!pageData && <Row>
                        <CoverMenuMeta {...pageData.data.cover_block.meta_menu} button_size='xs' />
                        </Row>
                    }
                    {!!pageData && <Row>
                        <CoverMenu
                            {...pageData.data.cover_block.actions_menu}
                            uri={profileUrl}
                            isSplitMenu={true}
     
                            size="sm"
                        />

                    </Row>}
                </View>
            </View>
        
    );
});

/**
 * ProfileHoverCard - Wraps content with a hover card showing profile details
 * Only renders on web, returns children directly on native
 */
function ProfileHoverCard_({ profileData, children, disabled = false }) {
    // On native, just return children - no hover card support
    if (!isWeb) {
        return children;
    }

    // On web, if disabled or no profile, just return children
    if (disabled || !profileData?.id) {
        return children;
    }

    const [pageData, setPageData] = useState(false);

    useEffect(() => {
        (async () => {
            const sResponse = await getPageData(profileData?.url.slice(1), false);
            if (sResponse.data !== pageData.data) {
                setPageData({ data: sResponse.data });
            }
        })();
    }, []);

    return (
        <HoverCard>
            <HoverCardTrigger>{children}</HoverCardTrigger>
            <HoverCardContent className="w-80 p-0">
                <ProfileCardContent profileData={profileData} pageData={pageData} />
            </HoverCardContent>
        </HoverCard>
    );
}

const ProfileHoverCard = memo(ProfileHoverCard_);

export default ProfileHoverCard;
export { ProfileHoverCard };
