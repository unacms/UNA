import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view'
import {
    UnitActions,
    UnitImage,
    UnitProfileList,
    UnitTitle,
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
        <UnitWrapper data={data} module={module} as="list" padding="p-2">
            <View className="flex-row sm:flex-col p-1">
                <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-xl overflow-hidden items-center justify-center bg-muted-foreground/20">
                    <UnitImage
                        image={data.cover}
                        alt={data.title}
                        skeleton={isSkeleton}
                        view="cover"
                        className="absolute u-cover rounded-lg"
                    />
                </View>
                <View className="p-3  flex-auto items-between justify-between ">
                    <View>
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                        />
                        <Row className="items-center h-6 my-3">
                            <UnitProfileList
                                data={data}
                                skeleton={isSkeleton}
                                labelClassName="truncate text-xs leading-tight flex-auto text-muted-foreground "
                                displaySize="xs"
                            />
                        </Row>
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        skeleton={isSkeleton}
                        className="flex-row sm:flex-col w-full"
                        inlineSecondary
                    />
                </View>
            </View>
        </UnitWrapper>
    );
}
