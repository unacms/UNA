import { View, ScrollView } from 'app/design/view';

export default function PageLayout(props) {
    return (<ScrollView className="w-full sm:mt-4">{props.children}</ScrollView>)
}
