
import ChkList from 'app/ui/molecules/checkbox_list';
import RbList from 'app/ui/molecules/radio_list';
import { fetcher } from 'app/lib/fetcher';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementSimpleList({ onFormEmpty, data, blockWrapperProps }) {

    function decomposeToPowersOfTwo(n) {
        const powers = [];
        let power = 0;

        while (n > 0) {
            if (n & 1) powers.push(power + 1); // если последний бит = 1
            n >>= 1; // сдвигаем вправо
            power++;
        }

        return powers;
    }

    const handleSubValueChange = async (val) => {

        const request_url = data.callback + val
            .slice()
            .sort((a, b) => b - a)
            .map(v => `role[]=${v}`)
            .join('&') + '&';;
        await fetcher(request_url);
        onFormEmpty();
    }

    const selectedValues = decomposeToPowersOfTwo(data.value)
    return (
        <BlockWrapper {...blockWrapperProps}>
            <ChkList multi={data?.multi === 0 ? false: true} values={data.values} setValue={handleSubValueChange} selectedValue={selectedValues} />
        </BlockWrapper>
    )

}