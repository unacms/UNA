
import { View, Row } from 'app/design/view';
export default function PageLayout(props) {
    return (<View className="w-full max-w-5xl mx-auto lg:mt-4">{props.children}</View>)
}
