import { useImperativeHandle, forwardRef } from 'react';
import { useRouter, useGlobalSearchParams } from 'app/lib/hooks/router'
import { Platform } from 'react-native'

const ElementRedirect = (props, ref) => {
    const router = useRouter();
    const gsp = useGlobalSearchParams();

    useImperativeHandle(ref, () => ({
        redirect: (sUrl) => {
            const target = Platform.OS === 'web'
                ? sUrl
                : { pathname: `/${gsp?.name}`, params: { url: sUrl } };

            router.push(target);
        }
    }));
};

export default forwardRef(ElementRedirect)