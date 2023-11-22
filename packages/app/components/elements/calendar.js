import { Text } from 'app/design/typography'
import { AgendaList, CalendarProvider, ExpandableCalendar, calendarTheme } from 'react-native-calendars';
import { View, Row } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link'
import { fetcher } from 'app/lib/fetcher';
import { useEffect, useState, useRef } from 'react';
import Card from 'app/ui/molecules/card'
import { Icon } from 'app/ui/atoms/icon'
import { Theme } from 'app/design/theme';
import { stripTags } from 'app/lib/util';
import { Button } from 'app/design/controls';

export default function ElementCalendar({ data }) {
    const [cdata, setData] = useState(false);
    const { colors } = Theme();

    function getMarkedDates() {
        const marked = {};
        transformedData?.forEach(item => {
            if (item.data && item.data.length > 0) {
                marked[item.title] = { marked: true };
            } else {
                marked[item.title] = { disabled: true };
            }
        });
        return marked;
    }

    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await fetcher('/api.php?r=' + data.request_url);
            setData(sResponse.data);
        };
        fetchData();
    }, []);

    if (!cdata)
        return <></>;

    const transformedData = transformToCalendarFormat(cdata);
    const marked = getMarkedDates();

    function transformToCalendarFormat(data) {
        const groupedEvents = {};

        data.forEach(event => {
            const date = new Date(event.start).toISOString().split('T')[0];
            if (!groupedEvents[date]) {
                groupedEvents[date] = [];
            }
            groupedEvents[date].push(event);
        });

        const items = Object.keys(groupedEvents).map(date => {
            return { title: date, data: groupedEvents[date] };
        });
        return items;
    }

    const onDateChanged = (a) => {
        // console.log(a);
    }
 
    return (
        <View className='w-full'>
            <CalendarProvider
                date={transformedData[0]?.title}
                onDateChanged={onDateChanged}
            >
            <Row className='w-full space-x-2 '>
                    <View className='h-screen pt-2 w-full md:w-2/3'>
                    <AgendaList
                        sections={transformedData}
                        avoidDateUpdates={false}
                        scrollToNextEvent={true}
                        viewOffset={0}
                        sectionStyle={{ fontSize:16, paddingBottom:12, paddingTop:12, marginHorizontal:2, marginBottom:16, color:colors.default, backgroundColor:colors.barsBackground, borderRadius:8, borderColor:colors.selectBorder, borderWidth:1, borderStyle:'solid' }}
                        renderItem={(item, firstItemInDay) => {
                            return (
                                <Link href={item.item.url}>
                                    <View className='   pl-8 pb-4 pr-2 '>
                                        
                                        <View className='absolute z-50 top-0 left-2 w-4 h-4 border-2 border-bgrbody dark:border-bgrbody-d flex-none rounded-full bg-neutral-300 dark:bg-neutral-700'></View>
                                        <View className='absolute z-10   -top-4 left-3.5 w-1 h-full  flex-none  bg-neutral-200 dark:bg-neutral-900'></View>

                                    
                                        <Card addClassName="flex-auto p-4  flex-col gap-y-2" margin="" >
                                     
                                                <Text className=" text-neutral-900 dark:text-neutral-100 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base font-bold">{item.item.title}</Text>
                                                <Row className='text-center gap-x-2 items-center'> 
                                                    <Button startDecorator='CalendarCheck' size="xs"/>
                                                    <Time className="text-base text-neutral-700 dark:text-neutral-300" ts={item.item.date_start}/>
                                                    <Text className="text-base text-neutral-700 dark:text-neutral-300" >-</Text>
                                                    <Time className="text-base text-neutral-700 dark:text-neutral-300" ts={item.item.date_end}/>
                                                </Row>
                                                {item.item.location != '' && (<Row  className='text-center gap-x-2 items-center'><Button startDecorator='MapPin' size="xs"/><Text  className="text-xs text-neutral-700 dark:text-neutral-300">{item.item.location}</Text></Row>)}
                                                <Text className="text-neutral-700 dark:text-neutral-300" numberOfLines={2}> {stripTags(item.item.description)}</Text>
                                           
                                        </Card>
                                    </View>
                                </Link>
                            );
                        }}
                        renderEmptyData={() => {
                            return <View />;
                        }}
                    /></View>
                    <View className='hidden md:block w-1/3 '>
                        <Card margin="m-2 pb-2" rounded="rounded">
                        <ExpandableCalendar
                            firstDay={1}
                            markedDates={marked}
                            animateScroll
                            initialPosition={'closed'}
                            hideKnob={false}
                        />
                        </Card>
                    </View>
                </Row>
            </CalendarProvider>
        </View>
    );
}
