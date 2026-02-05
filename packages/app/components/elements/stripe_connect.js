import { useEffect, useRef } from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js/pure';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { View } from 'app/design/view'
import { Loading } from 'app/customization/loading'
import { BlockWrapper } from 'app/components/block-wrapper'

const handleNotificationsChange = ({ total, actionRequired }) => {
    console.log('Всего уведомлений:', total, 'Требуют действия:', actionRequired);
};

export default function NotificationBanner({ data, blockWrapperProps }) {

    const secretRef = useRef(null);
    const { currentUser } = useCurrentUser();
    if (!currentUser) {
        return null; 
    }

    const heights = {
        payments: 'h-96',
        balances: 'h-40',
        'notification-banner': 'h-24'
    }

    const fetchClientSecret = async () => {

        if (secretRef.current) {
            return secretRef.current;
        }
        const res = await fetcher(`/api.php?r=bx_stripe_connect/account_session_create&params[]=${currentUser.id}`);
        secretRef.current = res.data.secret;
        return res.data.secret;
    };

    const publishableKey = data.key;
    const appearance = { variables: { colorPrimary: '#228403' } }
    const collectionOptions = { fields: 'eventually_due', futureRequirements: 'include' }
    const onNotificationsChange = handleNotificationsChange
    const containerRef = useRef(null);

    useEffect(() => {
        const connectInstance = loadConnectAndInitialize({
            publishableKey,
            fetchClientSecret,
            appearance,
        });

        const banner = connectInstance.create(data.embed);
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(banner);

        return () => {
            if (banner.remove) banner.remove();
        };
    }, [currentUser.id]);

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View ref={containerRef} className={`w-full overflow-hidden ${heights[data.embed]}`} >
                <Loading/>
            </View>
        </BlockWrapper>
    );
}