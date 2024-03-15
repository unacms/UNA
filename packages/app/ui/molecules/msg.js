import { Alert } from 'react-native';

export default function (props) {

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
