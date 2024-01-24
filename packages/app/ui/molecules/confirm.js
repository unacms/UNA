
import { Alert } from 'react-native';
import { useState } from 'react';


export default function ElementConfirm(props) {
    const handleCancel = async () => {
        props.handleCancel();
    }

    const handleOk = async () => {
        props.handleOk();
    }

    if (props.onVisible) {
        Alert.alert(props.title, props.text, [
            {
              text: 'Cancel',
              onPress: () => handleCancel(),
              style: 'cancel',
            },
            {text: 'OK', onPress: () => handleOk()},
          ]);
    }

    return <></>
}
