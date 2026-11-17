import { UnitContentCard } from 'app/components/units/helpers'

// An ad's card: the picture, the title, the author, the date and the price in the seller's currency.
export default function Unit({ data, module, listIndex }) {
    return <UnitContentCard data={data} module={module ?? data?.module} listIndex={listIndex} />
}
