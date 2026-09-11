import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next'
import {
    UnitActions,
    UnitProfileImage,
    UnitProfileList,
    UnitTitle,
    UnitWrapper,
    useUnitActions,
} from 'app/components/units/helpers'

export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation()
    const { primaryMenuItem, secondaryMenuItem, deleteMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    })

    const isSkeleton = data?.skeleton;

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-3 sm:p-2">
            <View className="flex-row sm:flex-col gap-3 sm:gap-1">
                <UnitProfileImage data={data} skeleton={isSkeleton} />
                {deleteMenuItem ? <View className="absolute right-1 top-1 z-10 shrink-0">{deleteMenuItem}</View> : null}
                <View className="py-1 sm:p-1 justify-between gap-2 flex-auto ">
                    <View className="gap-2 h-12">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            numberOfLines={1}
                        />
                        <Row className="items-center gap-1 h-5">
                            <UnitProfileList
                                data={data}
                                unitType={unitType}
                                skeleton={isSkeleton}
                            />
                        </Row>
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        skeleton={isSkeleton}
                    />
                </View>
            </View>
        </UnitWrapper>
    )
}
