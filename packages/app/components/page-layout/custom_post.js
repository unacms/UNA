
import { View } from 'app/design/view';
export default function PageLayout(props) {
    return (<View className="w-full sm:p-4 max-w-5xl mx-auto ">{props.children}</View>)
}
