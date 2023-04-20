import { Pressable } from 'app/design/view'
import { Link } from 'expo-router';
import { FeedbackHaptics } from '../../lib/util';

export default function ElementLink(props) {
    if (!props.href)
        props.href ='/'
    return (
        <Link href={props.href} asChild {...props}>
             <Pressable onPress={() => {
                    props.haptics ? FeedbackHaptics(props.haptics) : ''
                }}>
                {props.children}
            </Pressable>
        </Link>
  )
}
