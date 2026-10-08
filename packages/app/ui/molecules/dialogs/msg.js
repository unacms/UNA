import { useEffect, useEffectEvent } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function (props) {
    const { t } = useTranslation();

    const handleOk = async () => {
        props.handleOk();
    }

    const showAlert = useEffectEvent(() => {
        Alert.alert(props.title, props.text, [
            {text: t('OK'), onPress: () => handleOk()},
          ]);
    });

    // Once per show, not on every render: a caller that re-renders while the
    // message is up (an uploading files field) would otherwise stack alerts.
    useEffect(() => {
        if (props.onVisible) showAlert();
    }, [props.onVisible, props.title, props.text]);

    return <></>
}
