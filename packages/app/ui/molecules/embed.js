import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'

export default function ({ data }) {

    return <Link href={data.url} >
        <Row className='rounded-lg mt-2 border border-bdrcard dark:border-bdrcard-d'>
            <View className='aspect-square h-32 mr-4'>
                <Image view="cover" sizes="(max-width:1024px) 100vw, 1024px" resizeMode="cover" className="rounded-tl-lg rounded-bl-lg " src={data.image} />
            </View>
            <View className='flex-auto my-2 mr-4'>
                <Text className="text-neutral-900  dark:text-neutral-100 text-base font-bold " numberOfLines={1}>{data.title}</Text>
                <Text className="text-neutral-900  dark:text-neutral-100 text-base my-2" numberOfLines={2}>{data.description}</Text>
                <Row className='gap-x-2'>
                    <View className='h-6 w-6'><Image view="cover" resizeMode="cover" sizes="(max-width:1024px) 100vw, 1024px" src={data.logo} />
                    </View>
                    <Text className="text-neutral-900 dark:text-neutral-100 text-base">{data.domain}</Text>
                </Row>
            </View>
        </Row>
    </Link>
}
