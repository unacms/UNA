import { useImperativeHandle, forwardRef }  from 'react';
import { useRouter, useGlobalSearchParams } from 'expo-router';

const ElementRedirect = (props, ref) =>  {
    const router = useRouter();
    const glob = useGlobalSearchParams();
    
    useImperativeHandle(ref, () => ({
        redirect: (sUrl) => {
            router.push({
                pathname: '/' + glob.name,
                params: { url: sUrl }
              });
        }
    }));
}

export default forwardRef(ElementRedirect)