
import { useState, useEffect } from 'react'
import { useCurrentUser } from 'app/context/user'
import { fetcher } from 'app/lib/fetcher';
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';

export default function BlockByUrl({url, exProps}) {

    const { currentUser, setCurrentUser } = useCurrentUser();
    const [data, setData] = useState(false)
    
    async function fetchData() {
        const sResponse = await fetcher(url);
        setData(sResponse.data);
    }

    useEffect(() => {  
        fetchData()
    }, []);

    if (!data)
        return <></>;

    let cnt = {content: data, designbox_id: 0}
    return <BlockByData block = {cnt}  exProps={exProps}/>
}