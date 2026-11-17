import { UnitProfileCard } from 'app/components/units/helpers'

// The same card as people's (they share the Connections lists).
export default function Unit({ data, unitType, module }) {
    return <UnitProfileCard data={data} unitType={unitType} module={module} />
}
