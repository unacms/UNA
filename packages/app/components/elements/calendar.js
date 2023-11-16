import { Text } from 'app/design/typography'
import { AgendaList, CalendarProvider, ExpandableCalendar, calendarTheme } from 'react-native-calendars';
import { View, Row } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link'
import { fetcher } from '../../lib/fetcher';
import { useEffect, useState, useRef } from 'react';
import Card from 'app/ui/molecules/card'
import { Icon } from 'app/ui/atoms/icon'
import { Theme } from 'app/design/theme';

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
        <View className='w-full mx-auto max-w-5xl'>
            <CalendarProvider
                date={transformedData[0]?.title}
                onDateChanged={onDateChanged}
            >
                
                <ExpandableCalendar
                    firstDay={1}
                    markedDates={marked}
                    animateScroll
                    initialPosition={'closed'}
                    hideKnob={false}
                />
                <View className='h-96 '>
                    <AgendaList
                        sections={transformedData}
                        avoidDateUpdates={false}
                        scrollToNextEvent={true}
                        viewOffset={0}
                        sectionStyle={{ fontSize:20, paddingBottom:12, paddingTop:12, color:colors.default, backgroundColor:colors.barsBackground, borderRadius:8}}
                        renderItem={(item, firstItemInDay) => {
                            return (
                                <Link href={item.item.url}>
                                    <Card margin="my-2 mx-4" rounded="rounded">
                                        <View className='p-4'>
                                            <Text className=" text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base font-bold">{item.item.title}</Text>
                                            <Row>
                                                <Time stylesName="text-base" ts={item.item.date_start}/>
                                                <Text> - </Text>
                                                <Time stylesName="text-base" ts={item.item.date_end}/>
                                            </Row>
                                            {item.item.location != '' && (<Row><Icon icon='MapPin' /><Text> {item.item.location}</Text></Row>)}
                                        </View>
                                    </Card>
                                </Link>
                            );
                        }}
                        renderEmptyData={() => {
                            return <View />;
                        }}
                    /></View>
            </CalendarProvider>
        </View>
    );
}
