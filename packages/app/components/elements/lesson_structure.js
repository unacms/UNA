import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import Card from 'app/ui/molecules/card'

export default function CourseStructure(props) {
    const data = props.data;
    return <View >
        {
            props.data.map((item) => {
                return (
                    <Card rounded=' rounded-none sm:rounded-2xl  ' margin=' max-w-screen-lg mx-auto w-full p-3 sm:p-4 mb-1 sm:mb-4 '>
                        <Link href={item.link}>
                            <View>
                            <Text>{item.title}</Text>
                            <Text>{item.pass_percent}</Text>
                            <Text>{item.pass_progress}</Text>
                            <Text>{item.pass_status}</Text>
                            <Text>{item.show_pass}</Text>
                            
                            </View>
                        </Link>
                    </Card>
                )
            })
        }
    </View>
}
