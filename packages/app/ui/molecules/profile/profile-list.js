import { View, Row } from 'app/design/view'
import Profile from 'app/ui/molecules/profile/profile';
import { appSetting, cn } from 'app/lib/util'

function fillArrayToLength(arr, maxCount, defaultValue) {
    while (arr.length < maxCount) {
        arr.push(defaultValue);
    }
    return arr;
}

export default function ProfilesList ({maxCount, showEmpty, data, displaySize="base", showLinks = true}) {
    const sizeConfig = appSetting('theme', 'profile_sizes', displaySize);
    const sSize = sizeConfig.container;

    if (data?.length > maxCount){
        data = data.slice(0, maxCount);
    }

    if (showEmpty)
        data = fillArrayToLength(data, maxCount, '');

    return (
        <Row className="items-center">
            {data?.length > 0 && data.map((profile, index) => {
                const offsetClass = index > 0 ? '-ml-2' : undefined;
                if (profile?.id) {
                    const pr = profile.author_data || profile;
                    return (
                        <Profile
                            key={index}
                            {...pr}
                            displayType="unit_wo_info"
                            displaySize={displaySize}
                            showLinks={showLinks}
                            className={offsetClass}
                            avatarClassName="shadow-avatar-stack"
                        />
                    );
                }
                return (
                    <View
                        key={index}
                        className={cn(sSize, 'rounded-full bg-card', offsetClass)}
                    />
                );
            })}
        </Row>
    );
}
