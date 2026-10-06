import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { NeoButton } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import Card from 'app/ui/molecules/page/card'
import Progress from 'app/ui/atoms/progress'
import Scroll from 'app/ui/molecules/page/scroll'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'



function CourseStructure(props) {
    const { t } = useTranslation();

    return <Scroll horizontal={true} step={250} className='w-full'>
        {
            props.data.map((item) => {
                let icon = "Check";
                let color = "gray-600";
                let colorButton = "emerald-400";
                let colorButtonText = "emerald-400";
                if (item.status == "in process") {
                    icon = "Hourglass";
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
                                    <View className='my-2 text-xs '><Text className="text-white">{t('Module {{index}}', { index: item.index })}</Text></View>
                                    <View className='h-12'>
                                        <Text className="text-white text-lg leading-tight tracking-tight font-bold text-secondary-foreground " numberOfLines={2}>{item.title}</Text>
                                    </View>
                                </View>
                                <Row className='gap-x-2 items-end mt-4'>
                                    <NeoButton controlSize="mini" borderShape="capsule" image={icon} label={item.status} />
                                    {item.counters.map((item2, index) => {
                                        return (
                                            <NeoButton key={`cnt-${index}`} controlSize="mini" borderShape="capsule" label={`${item2.cn_progress} ${item2.cn_title}`} />
                                        )
                                    })}
                                </Row>
                            </Link>
                        </Card>
                    </View>
                )
            })
        }
        <NeoButton label={t('Add module')} onPress={addModule} />
    </Scroll>
}

export default memo(CourseStructure);