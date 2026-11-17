import { UnitProfileCard } from 'app/components/units/helpers'

// A course has the context card (as groups): its picture, the name, the members, then Join and Follow.
export default function Unit({ data, unitType, module }) {
    return <UnitProfileCard data={data} unitType={unitType} module={module} />
}
