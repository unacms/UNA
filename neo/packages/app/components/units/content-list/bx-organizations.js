import { View } from 'app/design/view'
import { useTranslation } from 'react-i18next'
import {
    getProfileListLabel,
    PROFILE_ROW_NAME,
    PROFILE_ROW_NAME_SKELETON,
    UnitActions,
    UnitProfileImage,
    UnitProfileConnections,
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
    const hasCount = isSkeleton || !!getProfileListLabel({ data, unitType, profile: true })

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-1">
            <View
                className={`flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 sm:h-full`}
            >
                <UnitProfileImage data={data} skeleton={isSkeleton} />
                {deleteMenuItem ? <View className="hidden sm:flex absolute right-1 top-1 z-10 shrink-0">{deleteMenuItem}</View> : null}
                <View className="flex-row sm:flex-col items-center sm:items-stretch gap-2 sm:gap-0 my-auto sm:p-2 flex-auto min-w-0">
                    {/* The grid card: the name and the connections line are 8px apart, like the two buttons (24px +
                        8px + 20px: the block keeps its height on a card with no line), and 12px from the buttons. */}
                    <View className="sm:h-13 sm:gap-2 flex-1 sm:flex-none min-w-0">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            numberOfLines={1}
                            className={PROFILE_ROW_NAME}
                            skeletonClassName={PROFILE_ROW_NAME_SKELETON}
                        />
                        {hasCount ? (
                            <UnitProfileConnections data={data} unitType={unitType} skeleton={isSkeleton} />
                        ) : null}
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        skeleton={isSkeleton}
                        className="flex-none flex-row gap-2 sm:gap-0 sm:flex-col sm:pt-3"
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
