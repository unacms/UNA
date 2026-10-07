import { appSetting } from 'app/lib/util'
import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next';
import Profile from 'app/ui/molecules/profile/profile'
import {
    UnitActions,
    UnitImage,
    UnitProfileList,
    UnitTitle,
    UnitVisibility,
    UnitWrapper,
    useUnitActions,
} from 'app/components/units/helpers';
import Link from 'app/ui/atoms/link'

function UnitBase({ data, module, primaryMenuItem, secondaryMenuItem, deleteMenuItem }) {
    const bShowProfilePic = appSetting('cover', 'show_pic_by_module', 'bx_spaces')

    return (
        <UnitWrapper data={data} module={module} padding="p-1">
            <View className="flex-row sm:flex-col p-1">
                <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-lg sm:rounded-xl overflow-hidden items-center justify-center bg-muted-foreground/20">
                    <UnitImage
                        image={data.cover}
                        alt={data.title}
                        view="cover"
                        className="absolute u-cover rounded-lg"
                    />
                </View>
                {!!deleteMenuItem && <View className="absolute right-2 top-2">{deleteMenuItem}</View>}
                <View className="p-2 flex-auto items-between justify-between ">
                    <View>
                        <Row className="items-center gap-2">
                            {bShowProfilePic ? (
                                <Profile
                                    url_avatar={data?.image?.src}
                                    displayType="unit_wo_info"
                                    displaySize="base"
                                    display_name={data.title}
                                    id={data.id || data.title}
                                />
                            ) : null}
                            <UnitTitle
                                title={data.title}
                                numberOfLines={1}
                            />
                        </Row>
                        <Row className="items-center h-5 my-3">
                            <UnitProfileList
                                data={data}
                                labelClassName="truncate text-xs leading-tight flex-auto text-muted-foreground"
                            />
                            <UnitVisibility visibility={data.visibility} />
                        </Row>
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        className="flex-row sm:flex-col w-full"
                        inlineSecondary
                    />
                </View>
            </View>
        </UnitWrapper>
    );
}

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

export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation();
    const { primaryMenuItem, secondaryMenuItem, deleteMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    });

    if (unitType === 'list') {
        return <UnitList data={data} />;
    }

    return (
        <UnitBase
            data={data}
            module={module}
            primaryMenuItem={primaryMenuItem}
            secondaryMenuItem={secondaryMenuItem}
            deleteMenuItem={deleteMenuItem}
        />
    );
}
