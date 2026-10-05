import { useFetch } from 'app/lib/hooks/use-fetch';
import { BlockByDataInt as BlockByData } from 'app/components/block';

export default function BlockByUrl({url, exProps}) {
    const { data: sResponse } = useFetch(url);
    const data = sResponse?.data;

    if (!data)
        return <></>;

    let cnt = {content: data, designbox_id: 0}
    return <BlockByData block = {cnt}  exProps={exProps}/>
}
