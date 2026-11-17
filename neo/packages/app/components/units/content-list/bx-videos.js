import { UnitContentCard } from 'app/components/units/helpers'

// A video's card: its poster, the title, the author and the date (UnitContentCard).
export default function Unit({ data, module, listIndex }) {
    return <UnitContentCard data={data} module={module ?? data?.module} listIndex={listIndex} />
}
