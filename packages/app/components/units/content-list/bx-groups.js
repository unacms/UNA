import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next';
import {
    UnitActions,
    UnitImage,
    UnitProfileList,
    UnitTitle,
    UnitVisibility,
    UnitWrapper,
    useUnitActions,
} from 'app/components/units/helpers';

export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation();
    const { primaryMenuItem, secondaryMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    });

    const isSkeleton = data?.skeleton;
    return (
        <UnitWrapper data={data} module={module} padding="p-1">
            <View className="bg-secondary aspect-video overflow-hidden rounded-xl w-full">
                <UnitImage
                    image={data.cover}
                    alt={data.title}
                    skeleton={isSkeleton}
                    view="cover"
                    className="absolute u-cover"
                />
            </View>
            <View className="flex-auto p-2 gap-3">
                <View className="h-16 gap-1 justify-between">
                    <UnitTitle
                        title={data.title}
                        skeleton={isSkeleton}
                    />
                    <Row className="items-center gap-1 h-5">
                        <UnitProfileList
                            data={data}
                            skeleton={isSkeleton}
                            labelClassName="truncate text-xs leading-tight flex-auto text-secondary-foreground"
                        />
                        <UnitVisibility visibility={data.visibility} skeleton={isSkeleton} />
                    </Row>
                </View>
                <UnitActions
                    primaryMenuItem={primaryMenuItem}
                    secondaryMenuItem={secondaryMenuItem}
                    skeleton={isSkeleton}
                    className="flex-row sm:flex-col gap-2 w-full"
                    inlineSecondary
                />
            </View>
        </UnitWrapper>
    );
}
