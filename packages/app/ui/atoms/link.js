import { TouchableOpacity } from 'app/design/view'
import { Link } from 'expo-router';
import { FeedbackHaptics } from '../../lib/util';

export default function ElementLink(props) {
    return (
        <Link href={props.href} asChild {...props}>
             <TouchableOpacity onPress={() => {
                    props.haptics ? FeedbackHaptics(props.haptics) : ''
                }}>
                {props.children}
            </TouchableOpacity>
        </Link>
  )
}
