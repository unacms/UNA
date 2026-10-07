import { useCardData } from 'app/context/card'
import { UnitProfileRow, UnitRecommendation } from 'app/components/units/helpers'

export default function Unit({ data }) {
    const { cardData } = useCardData()
    if (cardData?.hidden) return null

    return (
        <UnitProfileRow
            data={data}
            displaySize="md"
            linkProps={{ variant: 'ghost', size: 'lg' }}
            className="flex-row gap-2 items-center"
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
