import { Platform } from 'react-native'
import { updateRightHeaderObj } from 'app/lib/native-handlers';
import { useNavigation } from '@react-navigation/native';

export default function Nav({addButtons}) {
    
    const navigation = useNavigation();
    setTimeout(() => {
        updateRightHeaderObj(addButtons, navigation);
    }, 300);

    return <></>
}