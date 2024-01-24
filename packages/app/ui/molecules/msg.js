import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input, InputRounded, Modal } from 'app/design/controls';
import { Alert } from 'react-native';
import { useState } from 'react';


export default function ElementMsg(props) {

    const handleOk = async () => {
        props.handleOk();
    }

    if (props.onVisible) {
        Alert.alert(props.title, props.text, [
            {text: 'OK', onPress: () => handleOk()},
          ]);
    }

    return <></>
}
