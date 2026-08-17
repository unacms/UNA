import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next'
import {
    UnitActions,
    UnitProfileImage,
    UnitProfileList,
    UnitTitle,
    UnitWrapper,
    useUnitActions,
} from 'app/lib/unit-helpers'

export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation()
    const { primaryMenuItem, secondaryMenuItem, deleteMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    })

    const isSkeleton = data?.skeleton

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-1">
            <View
                className={`flex-row sm:flex-col p-2 sm:p-0 sm:h-full`}
            >
                <UnitProfileImage data={data} skeleton={isSkeleton} />
                {deleteMenuItem ? <View className="absolute right-1 top-1 z-10 shrink-0">{deleteMenuItem}</View> : null}
                <View className="flex-col pl-4 my-auto sm:p-2 flex-auto ">
                    <View className="sm:h-12 gap-1">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            numberOfLines={1}
                        />
                        <Row className="items-center h-5">
                            <UnitProfileList
                                data={data}
                                unitType={unitType}
                                skeleton={isSkeleton}
                                labelClassName="truncate text-sm leading-5 tracking-tight flex-auto text-secondary-foreground"
                            />
                        </Row>
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        skeleton={isSkeleton}
                        className="flex-row sm:flex-col pt-2"
                        primaryClassName="w-1/2 sm:w-full pr-2 sm:pr-0"
                        secondaryClassName={`w-1/2 sm:w-auto${primaryMenuItem ? ' sm:mt-2' : ''}`}
                    />
                </View>
            </View>
        </UnitWrapper>
    )
}
