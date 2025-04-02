import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'

export default function CategoriesList(props) {
    return (
        <View className=" w-full flex-row flex-wrap">
            {props.data.map((item, index) => (
                <View className='w-full lg:w-1/3 sm:w-1/2'>
                    <Link key={`menu-${index}`} href={item.url}>
                        <View className="flex-row gap-x-1 border border-bdr dark:border-bdr-d p-1 bg-bgrcard dark:bg-bgrcard-d rounded-xl m-1">
                            <Button variant="text" startDecorator="Folder" />
                            <Text className="text-base my-auto font-medium text-neutral-800 dark:text-neutral-200 ">
                                {item.name}
                            </Text>
                            <Text className="ml-auto mr-1 text-sm my-auto font-semibold  rounded-full bg-bgritem dark:bg-bgritem-d px-2.5 py-0.5 text-neutral-800 dark:text-neutral-200 ">
                                {item.num > 0 ? '' + item.num + '' : ''}
                            </Text>
                        </View>
                    </Link>
                </View>
            ))}
        </View>
    )
}
