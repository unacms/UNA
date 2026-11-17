import { UnitContentCard } from 'app/components/units/helpers'

// A poll's card: its question, the author and the date (UnitContentCard).
export default function Unit({ data, module, listIndex }) {
    return <UnitContentCard data={data} module={module ?? data?.module} listIndex={listIndex} />
}
