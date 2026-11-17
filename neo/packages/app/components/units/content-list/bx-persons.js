import { UnitProfileCard } from 'app/components/units/helpers'

// Mobile: one row of photo, name + counts, and the buttons as icons.
// sm+: the grid card, buttons full width under the name (UnitProfileCard).
export default function Unit({ data, unitType, module }) {
    return <UnitProfileCard data={data} unitType={unitType} module={module} />
}
