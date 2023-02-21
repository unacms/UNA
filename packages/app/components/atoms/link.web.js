import { useRouter } from 'solito/router'
import {StyleSheet, TouchableOpacity, Vibration} from 'react-native';

export default function ElementLink(props) { 
    const { push, replace, back, parseNextPath } = useRouter()
    
    return (
        <TouchableOpacity onPress={() => { push(props.href);}}>
                {props.children}
        </TouchableOpacity>
    );
}
