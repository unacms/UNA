
import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import { Text } from 'app/design/typography'
import { Button, ButtonsGroup } from 'app/design/controls';
import Link from 'app/ui/atoms/link';

export default function PageLayout(props) {
    return (<View className="w-full sm:p-5 max-w-5xl mx-auto ">
        <View className='gap-y-2 py-4 px-4'>
        <Text>Dashboard content shoild be here</Text>
        <Link href="/logout" ><Button title="Logout" variant ='primary' /></Link>
        </View>
    </View>)
}
