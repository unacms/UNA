import { useCardData } from 'app/context/card'
import { UnitProfileRow, UnitRecommendation } from 'app/lib/unit-helpers'

export default function Unit({ data }) {
    const { cardData } = useCardData()
    if (cardData?.hidden) return null

    return (
        <UnitProfileRow
            data={data}
            displaySize="md"
            linkProps={{ variant: 'ghost', size: 'lg' }}
            className="flex-row gap-2 items-center web:group"
            titleClassName="text-sm leading-tight font-semibold text-card-foreground web:group-hover:text-foreground"
            meta={
                <UnitRecommendation
                    data={data}
                    params={{
                        button_full_width: true,
                        button_variant: 'default',
                        button_size: 'xs',
                    }}
                />
            }
        />
    )
}
