import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text, H1C } from 'app/design/typography'
import { stripTags, appSetting } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import { useWindowDimensions } from 'react-native'
import Image from 'app/ui/atoms/image'
import { useRouter } from 'expo-router'
import { Theme } from 'app/design/theme'
import { Icon } from 'app/ui/atoms/icon'
import Menu from 'app/components/menu'
import { BlurView } from 'expo-blur';
import ProfilesList from 'app/ui/molecules/profile_list'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Button } from 'app/design/controls'
import { FeedbackHaptics } from 'app/lib/util';
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
