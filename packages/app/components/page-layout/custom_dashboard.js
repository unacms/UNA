
import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import { Text } from 'app/design/typography'
import { Button, ButtonsGroup } from 'app/design/controls';
import Link from 'app/ui/atoms/link';

export default function PageLayout(props) {
    return (<View className="w-full sm:p-5 max-w-5xl mx-auto ">
        <View className='flex-col gap-4 py-4 px-8'>
            <View className='flex-row w-full gap-4 justify-between items-center'>
        <View className='flex-auto bg-backgroundcard dark:bg-backgroundcard-dark rounded-lg p-8  font-semibold text-neutral-800 dark:text-neutral-200'>Friends </View>
        <View className='flex-auto bg-backgroundcard dark:bg-backgroundcard-dark rounded-lg p-8  font-semibold text-neutral-800 dark:text-neutral-200'>Groups </View>
            </View>
            <View className='flex-row w-full gap-4 justify-between items-center'>
        <View className='flex-auto bg-backgroundcard dark:bg-backgroundcard-dark rounded-lg p-8  font-semibold text-neutral-800 dark:text-neutral-200'>Events </View>
        <View className='flex-auto bg-backgroundcard dark:bg-backgroundcard-dark rounded-lg p-8  font-semibold text-neutral-800 dark:text-neutral-200'>Posts </View>
            </View>
            <View className='flex-row w-full gap-4 justify-between items-center'>
        <View className='flex-auto bg-backgroundcard dark:bg-backgroundcard-dark rounded-lg p-8  font-semibold text-neutral-800 dark:text-neutral-200'>Messages </View>
        <View className='flex-auto bg-backgroundcard dark:bg-backgroundcard-dark rounded-lg p-8  font-semibold text-neutral-800 dark:text-neutral-200'>People </View>
            </View>
        <Link href="/logout" ><Button title="Logout" fullWidth variant ='primary' /></Link>
        </View>
    </View>)
}
