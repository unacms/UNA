import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function (props) {
    const { t } = useTranslation();

    const handleOk = async () => {
        props.handleOk();
    }

    if (props.onVisible) {
        Alert.alert(props.title, props.text, [
            {text: t('OK'), onPress: () => handleOk()},
          ]);
    }

    return <></>
}
