import { UnitProfileCard } from 'app/components/units/helpers'

// The same card as people's: the group's picture (its cover where it has none), the name, the members and
// followers, then Join and Follow.
export default function Unit({ data, unitType, module }) {
    return <UnitProfileCard data={data} unitType={unitType} module={module} />
}
