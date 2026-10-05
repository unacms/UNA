import { useCardData } from 'app/context/card'
import {
    UnitInvitationActions,
    UnitProfileRow,
    UnitRecommendation,
    useInvitationAction,
} from 'app/components/units/helpers'

export default function Unit({ data }) {
    const { cardData } = useCardData()
    const { dismissed, processInvitation } = useInvitationAction()

    if (cardData?.hidden || dismissed) return null

    const meta = data?.meta?.items?.[0]?.data ? (
        <UnitRecommendation
            data={data}
            params={{
                button_full_width: true,
                button_variant: 'secondary',
                button_size: 'sm',
            }}
        />
    ) : (
        <UnitInvitationActions data={data} processInvitation={processInvitation} />
    )

    return <UnitProfileRow data={data} meta={meta} />
}
