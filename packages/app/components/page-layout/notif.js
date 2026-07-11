import {BlockByName} from 'app/components/block';
import { clearNotif } from 'app/lib/util'
import { useEffect, useState } from "react";
import { useCurrentUser } from 'app/context/user'
import { View } from 'app/design/view'
import Snackbar from 'app/ui/atoms/snackbar';
import { useTranslation } from 'react-i18next';


export default function PageLayout(props) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [timeStamp, setTimeStamp] = useState({ts:Date.now(), nts: currentUser?.notificationsTs});
    const [snackbarVisible, setSnackbarVisible] = useState(false);
   
    useEffect(() => {
        clearNotif();
        setCurrentUser({
            notifications: 0,
            notificationsTs:Date.now()
        });
    }, [])

    useEffect(() => {
        if (currentUser?.notificationsTs != timeStamp.nts) {
            setTimeStamp({ts: Date.now(), nts: currentUser?.notificationsTs});
        }
    }, [currentUser?.notificationsTs]);

    useEffect(() => {
        if (currentUser){
            setSnackbarVisible(currentUser.notifications > 0);
        }
    }, [currentUser?.notifications])

    const handleShowNewContent = async () => {
        setTimeStamp({ts:Date.now(), nts: currentUser.notificationsTs});   
        clearNotif();
        setCurrentUser({
            notifications: 0,
            notificationsTs:Date.now()
        });
        setSnackbarVisible(false);
    }
//exProps={{ scrollProps: { pageData: props.data, headerHeight: 64 } }}
    return (  
        <View className='sm:p-2  items-center'>
            <View className='w-full max-w-3xl'>
            <Snackbar 
                visible={snackbarVisible} 
                onPress={handleShowNewContent} 
                onDismiss={() => setSnackbarVisible(false)}
                variant="primary" 
                title={t('New notifications')} 
                size="sm" 
            />
            <BlockByName data={props.data} key={timeStamp.ts} cachePrefix={timeStamp.ts} name={props.blocks.browse} />
            </View>
        </View>
    )
}
