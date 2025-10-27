
import ChkList from 'app/ui/molecules/checkbox_list';
import { fetcher } from 'app/lib/fetcher';

export default function ElementSimpleList(props) {
    const data = props.data;
    console.log("dsfsdfsd", props)

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
        props.onFormEmpty();
    }

    const selectedValues = decomposeToPowersOfTwo(data.value)
    console.log("selectedValues", selectedValues, data.value)

    console.log("datadata", data)
    return <ChkList values={data.values} setValue={handleSubValueChange} selectedValue={selectedValues} />
}