import { View } from 'app/design/view'
import Profile from 'app/ui/molecules/profile/profile'
import { UnitProfileCard, UnitTitle } from 'app/components/units/helpers';
import Link from 'app/ui/atoms/link'

function UnitList({ data }) {
    return (
        <Link href={data.url} emulate={true}>
            <View
                className=" flex-row  web:duration-200 rounded-xl active:opacity-50 items-center "
            >
                <View className="p-1.5">
                    <Profile
                        url_avatar={data?.image?.src}
                        displayType="unit_wo_info"
                        displaySize="sm"
                        display_name={data.title}
                    />
                </View>
                <View className="flex-row justify-between flex-auto items-center">
                    <UnitTitle
                        title={data.title}
                        numberOfLines={2}
                    />
                </View>
            </View>
        </Link>
    );
}

// A list's row (`unitType` "list") is the small one above; everywhere else a space has the same card as people's:
// its picture (the cover where it has none), the name, the members and followers, then Join and Follow.
export default function Unit({ data, unitType, module }) {
    if (unitType === 'list') {
        return <UnitList data={data} />;
    }

    return <UnitProfileCard data={data} unitType={unitType} module={module} />;
}
