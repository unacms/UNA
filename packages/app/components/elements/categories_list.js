import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'

export default function CategoriesList(props) {
    return (
        <View className="flex-col ">
            {props.data.map((item, index) => (
                <Link key={`menu-${index}`} href={'/search-keyword?keyword=' + item.value + '&cat=bx_market_cats&section=' + props.block.module}>
                <Text>{item.name} ({item.num})</Text>
                </Link>
            ))}
        </View>
    )
}
