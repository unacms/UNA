import { View, ScrollView } from 'app/design/view'
export const siteTitle = 'NEO';


export default function Layout(props) {
    return (<View  className=" bg-backgroundbody dark:bg-backgroundbody-dark text-gray-900 dark:text-gray-50 w-full h-full flex-1">{props.children}</View>);
}
