import { useRouter } from "expo-router";
import { useEffect } from 'react';
import {Loading} from 'app/loading'
import { View } from 'app/design/view'

export default function ElementRedirect({data}) {
    const router = useRouter();
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Redirect to:", data);
    useEffect(() => {
        if (data?.uri) {
            if (data.uri == '/')
                data.uri = '/home'
            if (data?.timeout)
                setTimeout(() => router.replace(data.uri), data.timeout);
            else
                router.replace(data.uri);
        }
    }, [data?.uri]);
    
    if (data?.timeout)
        return <View className='w-full'><Loading/></View>;
    return null;
}