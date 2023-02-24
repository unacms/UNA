import { useRouter } from 'solito/router'
import { TouchableOpacity } from 'app/design/view'

export default function ElementLink(props) { 
    const { push, replace, back, parseNextPath } = useRouter()
    
    return (
        <TouchableOpacity onPress={() => { push(props.href);}} {...props}>
                {props.children}
        </TouchableOpacity>
    );
}
