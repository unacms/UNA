import { UnitProfileCard } from 'app/components/units/helpers'

// A channel has the context card (as groups): its picture, the name, the members and followers, then Follow.
export default function Unit({ data, unitType, module }) {
    return <UnitProfileCard data={data} unitType={unitType} module={module} />
}
