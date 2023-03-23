import React, { useImperativeHandle, forwardRef }  from 'react';
import { useRouter } from 'next/router';

const ElementRedirect = (props, ref) =>  {
    const router = useRouter();

    useImperativeHandle(ref, () => ({
        redirect: (sUrl) => {
            router.push(sUrl); 
        }
    }));
}

export default forwardRef(ElementRedirect)