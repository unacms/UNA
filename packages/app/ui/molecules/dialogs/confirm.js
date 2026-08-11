
import { Alert } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';


export default function ElementConfirm({handleOk, handleCancel, onVisible, title, text, titleOk, titleCancel}) {
    const { t } = useTranslation();
    const _handleCancel = async () => {
        handleCancel();
    }

    const _handleOk = async () => {
        handleOk();
    }

    if (onVisible) {
        Alert.alert(title, text, [
            { text: titleOk ?? t('OK'), onPress: () => _handleOk() },
            { text: titleCancel ?? t('Cancel'), onPress: () => _handleCancel() },
        ]);
    }

    return <></>
}
