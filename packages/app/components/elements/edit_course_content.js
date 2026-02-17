import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import Card from 'app/ui/molecules/card'
import Progress from 'app/ui/atoms/progress'
import Scroll from 'app/ui/molecules/scroll'
import { memo } from 'react'



function CourseStructure(props) {

    return <Scroll horizontal={true} step={250} className='w-full'>
        {
            props.data.map((item) => {
                let icon = "Check";
                let color = "gray-600";
                let colorButton = "emerald-400";
                let colorButtonText = "emerald-400";
                if (item.status == "in process") {
                    icon = "HourglassSimple";
                    color = "red-400";
                    colorButton = "white";
                    colorButtonText = "red-400";
                }
                if (item.status == "not started") {
                    icon = "Bookmark";
                    color = "gray-400";
                    colorButton = "gray-500";
                    colorButtonText = "white";
                }

                return (
                    <View className='m-2 w-72' key={item.index}>
                        <Card rounded=' rounded-none sm:rounded-2xl  ' margin={'bg-' + color + ' max-w-screen-lg mx-auto w-full p-3 sm:p-4 mb-1 sm:mb-4 '}>
                            <Link href={item.link}>
                                <View className={`mb-2 bg-${color}`}>
                                    <Progress value={item.percent} />
                                    <View className='my-2 text-xs '><Text className="text-white">Module {item.index}</Text></View>
                                    <View className='h-12'>
                                        <Text className="text-white text-lg leading-tight tracking-tight font-bold text-label-secondary " numberOfLines={2}>{item.title}</Text>
                                    </View>
                                </View>
                                <Row className='gap-x-2 items-end mt-4'>
                                    <Button textColor={`text-${colorButtonText}`} bgColor={`bg-${colorButton}`} startDecorator={icon} variant="outline" title={item.status} size="xs" rounded />
                                    {item.counters.map((item2, index) => {
                                        return (
                                            <Button key={`cnt-${index}`} bgColor={`bg-white`} variant="default" title={`${item2.cn_progress} ${item2.cn_title}`} size="xs" rounded />
                                        )
                                    })}
                                </Row>
                            </Link>
                        </Card>
                    </View>
                )
            })
        }
        <Button  title="Add module" onPress={addModule}/>
    </Scroll>
}

export default memo(CourseStructure);