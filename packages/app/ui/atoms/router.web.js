import { useRouter } from "next/router";
import { useEffect } from 'react';

export default function CurRouter(props) {
    const router = useRouter();

    useEffect(() => {
       
        router.events.on("routeChangeStart", props.exitingFunction);
    
        return () => {
            router.events.off("routeChangeStart", props.exitingFunction);
        };
        }, [props]);


     return <></>   
    
}