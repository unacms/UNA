import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text, H1C } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import Card from 'app/ui/molecules/card'
import CircularProgress from 'app/ui/atoms/circular_progress'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'

export default function CourseStructure(props) {
    const data = props.data;
    console.log("data555", props)

    return <View >
        {
            props.data.map((item) => {

                let icon = "Check";
                let textColor = ""
                let color = "emerald-400";
                if (item.pass_status == "in process") {
                    icon = "HourglassSimple";
                    color = "red-400";
textColor = "white"
                }
                if (item.pass_status == "not started") {
                    icon = "BookmarkSimple";
                    color = "gray-500";
textColor = "white"
                }


                return (
                    <Card rounded=' rounded-none sm:rounded-2xl  ' margin='mx-2  w-full p-3 sm:p-4 mb-1 sm:mb-4 '>
                        <Link href={item.link}>
                            <Row className='w-full'>
                                <View className='items-center ml-4 pr-8 mr-8 border-r border-bdr dark:border-bdr-d justify-between'>

                                    {item.pass_status == 'completed' && <View className='h-16 w-16 rounded-full bg-emerald-400 items-center justify-center'><Text className=" text-white text-4xl"><Icon icon={icon} /></Text></View>}
                                    {item.pass_status == 'in process' && <CircularProgress classes='h-16 w-16' progressColor="#F87171" percentage={item.pass_percent} />}
                                    {item.pass_status == 'not started' && <View className='h-16 w-16 rounded-full bg-gray-500 items-center justify-center'><Text className=" text-white text-4xl"><Icon icon={icon} /></Text></View>}
                                    <Button variant="default" title={item.pass_progress} size="xs" rounded />
                                </View>
                                <View className='flex-1'>
                                    <View className='my-2 text-xs'><Text>Lesson {item.index}</Text></View>
                                    <View className='h-12'>
                                        <Text className="text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200" numberOfLines={2}>{item.title}</Text>
                                    </View>
                                    <Button startDecorator={icon} variant="default" textColor={`text-${textColor}`} bgColor={`bg-${color}`} title={item.pass_status} size="xs" rounded />
                                </View>
                                <View className='items-end justify-center'>
                                <Button endDecorator="ArrowRight" variant="default" title={item.pass_title} size="sm" rounded />
                                </View>
                            </Row>
                            <View>
                               
                            </View>
                        </Link>
                    </Card>
                )
            })
        }
    </View>
}

