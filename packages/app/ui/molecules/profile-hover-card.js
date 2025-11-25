import * as React from 'react';
import { memo } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { HoverCard, HoverCardTrigger, HoverCardContent } from 'app/ui/atoms/hover-card';
import Profile from 'app/ui/molecules/profile';
import Link from 'app/ui/atoms/link';

const isWeb = Platform.OS === 'web';

/**
 * Simple static content - no data fetching to avoid re-renders
 */
const ProfileCardContent = memo(function ProfileCardContent({ profileData }) {
    const displayName = profileData?.display_name || '';
    const avatarUrl = profileData?.url_avatar;
    const profileUrl = profileData?.url;
    const moduleName = profileData?.module?.replace('bx_', '');

    return (
        <View className="overflow-hidden rounded-md bg-popover">
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
                        {moduleName ? (
                            <Text className="text-xs text-muted-foreground">
                                @{moduleName}
                            </Text>
                        ) : null}
                    </View>
                </Row>
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

    return (
        <HoverCard>
            <HoverCardTrigger>{children}</HoverCardTrigger>
            <HoverCardContent className="w-72 p-0">
                <ProfileCardContent profileData={profileData} />
            </HoverCardContent>
        </HoverCard>
    );
}

const ProfileHoverCard = memo(ProfileHoverCard_);

export default ProfileHoverCard;
export { ProfileHoverCard };
