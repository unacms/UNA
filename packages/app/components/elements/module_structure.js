import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { useState } from 'react'
import { Text, H1C } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import Card from 'app/ui/molecules/card'
import CircularProgress from 'app/ui/atoms/circular_progress'
import { Button, Modal } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import { fetcher } from 'app/lib/fetcher'
import { ContentMore } from 'app/ui/molecules/contentmore';
import Image from 'app/ui/atoms/image';
import Svg, { Line, Circle } from 'react-native-svg';

const getColorByType = (type) => {
    if (type == 'theory') return 'sky-400'
    if (type == 'image') return 'indigo-400'
    if (type == 'poll') return 'red-400'
};

const getColorByTypeLesson = (item, index) => {
    if (index == 0) return ['#34D399', 'Check', 'bg-emerald-400', 'bg-emerald-400']
    if (index == 1) return ['#F87171', 'ArrowsClockwise', 'bg-emerald-400', 'bg-gray-400']
    return ['#9CA3AF', 'HourglassSimple', 'bg-gray-400', 'bg-gray-400']
};

function LessonStructure({ lessonData, startLessonPart }) {
    console.log("lessonData", lessonData)
    const [viewType, setViewType] = useState(0)

    return (
        <ScrollView className='w-full'>
            <Text className="text-xs mb-4">{lessonData?.sample} {lessonData?.index}</Text>
            <View className='mb-4'>
                <ContentMore numberOfSymbols={200} showLess={true} content={lessonData?.text} numberOfLines={3} openSmall={false} textClassName="  text-base text-neutral-600 dark:text-neutral-400" />
            </View>
            <Row className='gap-x-4 mb-4'>
                <Button variant="default" textColor={`text-white`} bgColor={`${viewType === 0 ? 'bg-red-400' : 'bg-gray-400'}`} title='Lesson' size="sm" onPress={() => { setViewType(0) }} />
                <Button variant="default" textColor={`text-white`} bgColor={`${viewType === 1 ? 'bg-red-400' : 'bg-gray-400'}`} title='Attachments' size="sm" onPress={() => { setViewType(1) }} />
            </Row>
            {viewType === 0 && <LessonSteps steps={lessonData.steps} startLessonPart={startLessonPart} />}
            {viewType === 1 && <LessonAttach attachments={lessonData.attachments} />}
        </ScrollView>
    );
}

function LessonAttach({ attachments }) {
    return <>
        {attachments.map((item, index) => {

            return (
                <Row key={`step-${index}`} className={`${index != 0 ? 'border-t border-bdr dark:border-bdr-d' : ''} py-2 px-2`}>
                    <View className={`w-24 justify-center`}>
                        <Text className="text-red-400  text-2xl"  ><Icon icon={'FileText'} /></Text>
                    </View>
                    <View className='flex-auto justify-center'>

                        <Text className=" text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200" numberOfLines={2}>{item.title}</Text>
                    </View>
                    <View className='justify-center'>
                        <Button startDecorator="DownloadSimple" variant="outline" title={'Download'} size="sm" />
                    </View>
                </Row>

            )
        })
        }
    </>
}

function LessonSteps({ steps, startLessonPart }) {
    //TODO lines
    return <>
        {steps.map((item, index) => {
            const [color, icon, color2, color3] = getColorByTypeLesson(item, index);
            return (
                <Pressable onPress={() => { startLessonPart(item.id, false) }}>
                    <Row key={`step-${index}`} >
                        <View className={`w-24 aspect-square items-center ${index === 0 ? 'justify-end' : ''}`}>
                            <View className={`w-2 ${color2} h-1/2`}></View>
                            {index != 0 && index != steps.length - 1 && <View className={`w-2 ${color3} ${(index == 0 || index == steps.length - 1 ? 'h-1/2' : 'h-1/2')}`}></View>}
                            <View className='items-center justify-center h-10 absolute top-[30px]'>
                                <Svg height="100" width="100" viewBox="0 0 100 100">
                                    <Circle cx="50" cy="50" r="50" fill={color} />
                                    <Circle cx="50" cy="50" r="40" fill="white" />
                                    <Circle cx="50" cy="50" r="30" fill={color} />
                                </Svg>
                                <Text className="text-white absolute text-base"  ><Icon icon={icon} /></Text>
                            </View>
                        </View>
                        <View className='mb-4 aspect-video w-40 mr-5 rounded bg-gray-500' >
                            {item.image?.src && <Image view='cover' sizes="(max-width:1024px) 100vw, 1024px" alt='' className="rounded" src={item.image?.src} />}
                        </View>
                        <View className={`${index != 0 ? 'border-t border-bdr dark:border-bdr-d' : ''} flex-auto`}>
                            <Button variant="default" textColor={`text-white`} bgColor={`bg-` + getColorByType(item.type)} title={item.type} size="xs" rounded />
                            <Text className="mt-2 text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200" numberOfLines={2}>{item.title}</Text>
                        </View>
                        <View className='justify-center'>
                            {item.link_pass && (
                                <Button endDecorator="ArrowRight" variant="default" title={item.link_title} size="sm" rounded onPress={() => { startLessonPart(item.id, true) }} />
                            )
                            }
                        </View>
                    </Row>
                </Pressable>
            )
        })
        }
    </>
}

function LessonItem({ lessonItemData }) {
    return (
        <ScrollView className='w-full'>
            <Text className="mb-4  text-base leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200">{lessonItemData.title} </Text>
            <View className='mb-4'>
                <ContentMore numberOfSymbols={200} showLess={true} content={lessonItemData?.text} numberOfLines={3} openSmall={false} textClassName="  text-base text-neutral-600 dark:text-neutral-400" />
            </View>
            TODO create content view depends on type
        </ScrollView>
    );
}

export default function ModuleStructure(props) {
    const data = props.data;
    //TODO STEPS & view & ширина окна, разные цвета
    const [lessonData, setLessonData] = useState(null)
    const [lessonId, setLessonId] = useState(null)

    const getLessonData = async (id, parent_id, isReset) => {
        try {
            const lessonResponse = await fetcher(`/api.php?r=bx_courses/entity_node_block/&params[]=${parent_id}&params[]=${id}`);
            setLessonData(lessonResponse.data[0].data);
            if (isReset) {
                await fetcher(`/api.php?r=bx_courses/pass_node/&params[]=${id}`);
            }
        } catch (error) {
            console.error("Error fetching lesson data or resetting:", error);
        }
    };

    const startLessonPart = async (id, isStart) => {

        if (isStart)
            await fetcher(`/api.php?r=bx_courses/pass_data/&params[]=${id}`);
        setLessonId(id);
    };

    const lessonItemData = lessonData ? lessonData.steps.find(item => item.id === lessonId) : null;
    console.log("lessonIdlessonId", lessonId, lessonData, lessonItemData)
    //lessonItemData
    return (
        <>
            {lessonData && (
                <Modal
                    onClose={() => { setLessonData(null); setLessonId(null) }}
                    title={lessonData?.title}
                    scrollable={true}
                >
                    {lessonId ? <LessonItem lessonItemData={lessonItemData} /> : <LessonStructure startLessonPart={startLessonPart} lessonData={lessonData} />}
                </Modal>

            )}
            <View >
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

                        // <Link href={item.link}>
                        return (
                            <Card key={item.index} rounded=' rounded-none sm:rounded-2xl  ' margin='mx-2  w-full p-3 sm:p-4 mb-1 sm:mb-4 '>
                                <Pressable onPress={() => { getLessonData(item.id, item.parent_id, false) }}>
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
                                            <Button endDecorator="ArrowRight" variant="default" title={item.pass_title} size="sm" rounded onPress={() => { getLessonData(item.id, item.parent_id, true) }} />
                                        </View>
                                    </Row>
                                    <View>

                                    </View>
                                </Pressable>
                            </Card>
                        )
                    })
                }
            </View>
        </>)
}

