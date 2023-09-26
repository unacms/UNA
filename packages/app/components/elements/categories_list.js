import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'

export default function CategoriesList(props) {
    return (
        <View className="flex-col ">
            {props.data.map((item, index) => (
                <Link key={`menu-${index}`} href={item.url}>
                <Text>{item.name} {item.num > 0 ? '(' + item.num + ')' : ''}</Text>
                </Link>
            ))}
        </View>
    )
}
