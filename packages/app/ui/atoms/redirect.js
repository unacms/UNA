import { useImperativeHandle, forwardRef }  from 'react';
import { useRouter } from 'expo-router';

const ElementRedirect = (props, ref) =>  {
    const router = useRouter();

    useImperativeHandle(ref, () => ({
        redirect: (sUrl) => {
            router.push('./' + sUrl);
        }
    }));
}

export default forwardRef(ElementRedirect)