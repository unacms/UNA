import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'

export default function CategoriesList(props) {
    return (
        <View className="flex-col mx-4">
            {props.data.map((item, index) => (
                <Link key={`menu-${index}`} href={item.url.replace('/','')}>
                <Text>xxx{item.name} {item.num > 0 ? '(' + item.num + ')' : ''}</Text>
                </Link>
            ))}
        </View>
    )
}
