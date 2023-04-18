
import { View } from 'app/design/view';
// Layout file for Alexey
export default function PageLayout(props) {
    return (<View className="w-full sm:p-5 max-w-5xl mx-auto ">{props.children}</View>)
}
