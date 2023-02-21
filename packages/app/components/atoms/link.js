import {StyleSheet, TouchableOpacity} from 'react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function ElementLink(props) {
    return (
        <Link href={props.href} asChild >
             <TouchableOpacity onPress={() => {
                props.vibrate ? Haptics.NotificationFeedbackType.Success: ''
                }}>
                {props.children}
            </TouchableOpacity>
        </Link>
  )
}
