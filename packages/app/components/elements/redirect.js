import { useRouter } from "expo-router";
import { useEffect } from 'react';

export default function ElementRedirect({data}) {
    const router = useRouter();
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Redirect to:", data);
    useEffect(() => {
        if (data?.uri) {
            if (data?.timeout)
                setTimeout(() => router.replace(data.uri), data.timeout);
            else
                router.replace(data.uri);
        }
    }, [data?.uri]);

    return null;
}