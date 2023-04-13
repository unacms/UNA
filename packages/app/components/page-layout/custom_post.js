
import { View } from 'app/design/view';
export default function PageLayout(props) {
    return (<View className="w-full sm:p-8 max-w-5xl mx-auto ">{props.children}</View>)
}
