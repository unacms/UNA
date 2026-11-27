import { formatDateInterval, useDateLocaleTag } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { UnitProfileCard } from 'app/components/units/helpers'

// The same card as people's, with the event's date under its name: the picture (the cover where it has none), the
// name, the date, who is going and interested, then Attend and Follow.
export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation()
    const dateLocaleTag = useDateLocaleTag()
    // A skeleton keeps the date's line, so the card does not grow when it loads.
    let subtitle = data?.skeleton ? ' ' : null
    if (data?.date_start)
        subtitle = formatDateInterval(data.date_start, data.date_end, t, dateLocaleTag)

    return (
        <UnitProfileCard
            data={data}
            unitType={unitType}
            module={module}
            subtitle={subtitle}
            subtitleIcon={data?.date_start ? 'Calendar' : null}
        />
    )
}
