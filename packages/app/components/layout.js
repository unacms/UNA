import { View } from 'app/design/view'


export default function Layout(props) {
    return (<View  className=" bg-bgrbody dark:bg-bgrbody-d text-neutral-900 dark:text-neutral-50 w-full h-full flex-1">{props.children}</View>);
}
