
import { Alert } from 'react-native';
import { useState } from 'react';


export default function ElementConfirm({handleOk, handleCancel, onVisible, title, text, titleOk = "Ok", titleCancel = "Cancel"}) {
    const _handleCancel = async () => {
        handleCancel();
    }

    const _handleOk = async () => {
        handleOk();
    }

    if (onVisible) {
        Alert.alert(title, text, [
            { text: titleOk, onPress: () => _handleOk() },
            { text: titleCancel, onPress: () => _handleCancel() },
        ]);
    }

    return <></>
}
