import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next'
import {
    getProfileListLabel,
    PROFILE_ROW_COUNT,
    PROFILE_ROW_NAME,
    PROFILE_ROW_NAME_SKELETON,
    UnitActions,
    UnitProfileImage,
    UnitProfileList,
    UnitTitle,
    UnitWrapper,
    useUnitActions,
} from 'app/components/units/helpers'

// Same mobile row as bx-persons (they share the Connections lists); sm+ keeps
// the grid card.
export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation()
    const { primaryMenuItem, secondaryMenuItem, deleteMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    })

    const isSkeleton = data?.skeleton
    // No count: drop the second line so the name centres on the photo (mobile).
    const hasCount = isSkeleton || !!getProfileListLabel({ data, unitType })

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-1">
            <View
                className={`flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 sm:h-full`}
            >
                <UnitProfileImage data={data} skeleton={isSkeleton} />
                {deleteMenuItem ? <View className="hidden sm:flex absolute right-1 top-1 z-10 shrink-0">{deleteMenuItem}</View> : null}
                <View className="flex-row sm:flex-col items-center sm:items-stretch gap-2 sm:gap-0 my-auto sm:p-2 flex-auto min-w-0">
                    <View className="sm:h-12 flex-1 sm:flex-none min-w-0">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            numberOfLines={1}
                            className={PROFILE_ROW_NAME}
                            skeletonClassName={PROFILE_ROW_NAME_SKELETON}
                        />
                        {hasCount ? (
                            <Row className="items-center h-5">
                                <UnitProfileList
                                    data={data}
                                    unitType={unitType}
                                    skeleton={isSkeleton}
                                    showList={false}
                                    labelClassName={PROFILE_ROW_COUNT}
                                />
                            </Row>
                        ) : null}
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        skeleton={isSkeleton}
                        className="flex-none flex-row gap-2 sm:gap-0 sm:flex-col sm:pt-2"
                        primaryClassName="sm:w-full"
                        compactOnMobile
                        secondaryClassName={`sm:w-auto${primaryMenuItem ? ' sm:mt-2' : ''}`}
                        skeletonClassName="h-9 w-24 sm:w-full"
                    />
                    {deleteMenuItem ? <View className="sm:hidden flex-none">{deleteMenuItem}</View> : null}
                </View>
            </View>
        </UnitWrapper>
    )
}
