import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function CategoriesList({ data, blockWrapperProps }) {
    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className=" w-full flex-row flex-wrap">
                {data.map((item, index) => (
                    <View className='w-full lg:w-1/3 sm:w-1/2'>
                        <Link key={`menu-${index}`} href={item.url}>
                            <View className="flex-row gap-x-1 border border-border/60  p-1 bg-card rounded-xl m-1">
                                <Button variant="text" startDecorator="Folder" />
                                <Text className=" text-base my-auto font-medium text-secondary-foreground  ">
                                    {item.name}
                                </Text>
                                <Text className="ml-auto mr-1 text-sm my-auto font-semibold  rounded-full bg-muted  px-2.5 py-0.5 text-secondary-foreground  ">
                                    {item.num > 0 ? '' + item.num + '' : ''}
                                </Text>
                            </View>
                        </Link>
                    </View>
                ))}
            </View>
        </BlockWrapper>
    )
}
