import { UnitContentCard } from 'app/components/units/helpers'

// A content item's card (UnitContentCard), as UNA's site draws it.
export default function Unit({ data, module, listIndex }) {
    return <UnitContentCard data={data} module={module ?? data?.module} listIndex={listIndex} />
}
