import { View } from 'app/design/view'
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';

export default function Layout(props) {
    return (
        <>
            <Suggestions/>
            <AsyncWorker/>
            <View  className=" bg-bgrbody dark:bg-bgrbody-d text-neutral-900 dark:text-neutral-50 w-full h-full flex-1">
                {props.children}
            </View>
        </>
    );
}
