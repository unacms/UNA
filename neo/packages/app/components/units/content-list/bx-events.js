import { formatDateInterval, useDateLocaleTag } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { UnitProfileCard } from 'app/components/units/helpers'

// The same card as people's, with the event's date under its name: the picture (the cover where it has none), the
// name, the date, who is going and interested, then Attend and Follow.
export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation()
    const dateLocaleTag = useDateLocaleTag()
    // A skeleton keeps the date's line, so the card does not grow when it loads.
    const subtitle = data?.date_start
        ? formatDateInterval(data.date_start, data.date_end, t, dateLocaleTag)
        : (data?.skeleton ? ' ' : null)

    return <UnitProfileCard data={data} unitType={unitType} module={module} subtitle={subtitle} />
}
