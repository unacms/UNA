import {Loading} from 'app/loading'
import { View } from 'app/design/view'
export default function ElementRedirect({data}) {
    if (data?.uri) {
        document.location = data.uri;
    }
    if (data?.timeout)
        return <View className='w-full'><Loading/></View>;
}