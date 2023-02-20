import {StyleSheet, TouchableOpacity, Vibration} from 'react-native';
import { Link } from 'expo-router';

export default function ElementLink(props) {
    console.log(props.vibration);
    return (
        <Link href={props.href} asChild >
             <TouchableOpacity onPress={() => {
                props.vibrate ? Vibration.vibrate(parseInt(props.vibrate)): ''
                }}>
                {props.children}
            </TouchableOpacity>
        </Link>
  )
}
