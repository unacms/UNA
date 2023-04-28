import { View, ScrollView } from 'app/design/view';

export default function PageLayout(props) {
    return (<ScrollView className="w-auto sm:m-4 sm:">{props.children}</ScrollView>)
}
