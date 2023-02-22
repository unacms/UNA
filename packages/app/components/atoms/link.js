import { StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { FeedbackHaptics } from '../../lib/util';

export default function ElementLink(props) {
    return (
        <Link href={props.href} asChild >
             <TouchableOpacity onPress={() => {
                    props.haptics ? FeedbackHaptics(props.haptics) : ''
                }}>
                {props.children}
            </TouchableOpacity>
        </Link>
  )
}
