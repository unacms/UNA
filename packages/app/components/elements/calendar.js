import { Text } from 'app/design/typography'
//import { AgendaList, CalendarProvider, ExpandableCalendar, calendarTheme } from 'react-native-calendars';
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
import Image from 'app/ui/atoms/image'
import { getImageSizes } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static';

export default function ElementCalendar({ data }) {
    const [cdata, setData] = useState(false);
    const [showCalendar, setShowCalendar] = useState(true);

    const [Calendars, setCalendars] = useState(null);
    
    useEffect(() => {
        const loadComponents = async () => {
            const CalendarsModule = await import('react-native-calendars');
            setCalendars(() => CalendarsModule);
        };

        loadComponents();
    }, []);

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

    const fetchData = async () => {
        let params = {params: data.params};
        console.log("cdata", cdata)
        if (cdata){
            params.params = {start: cdata.params.end, end: cdata.params.end + 24*60*60*30};
        }
        const sResponse = await fetcher('/api.php?r=' + data.request_url + JSON.stringify(params));
        console.log("sResponse", sResponse, '/api.php?r=' + data.request_url + JSON.stringify(params))
        setData(sResponse.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (!cdata)
        return <></>;

    const transformedData = transformToCalendarFormat(cdata);
    const marked = getMarkedDates();

    function transformToCalendarFormat(data) {
        const groupedEvents = {};

        data.data.forEach(event => {
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
    const imageSizes = getImageSizes()

    if (transformedData.length == 0)
        return<>{appStatic('components_content_empty')}</>

    const onEndReached = () => {
        fetchData();
    };

    return (
        <View className='w-full'>
            <Calendars.CalendarProvider
                date={transformedData[0]?.title}
                onDateChanged={onDateChanged}
            >
            <View className='w-full space-x-2 sm:flex-row-reverse'>
                
                <View className={(!showCalendar ? 'hidden' : '') +' md:block f-full sm:w-1/3 '}>
                    <Card margin="m-2 pb-2" rounded="rounded">
                        <Calendars.ExpandableCalendar
                            firstDay={1}
                            markedDates={marked}
                            animateScroll
                            initialPosition={'closed'}
                            hideKnob={false}
                        />
                        
                    </Card>
                    
                </View>
                <View className='sm:hidden w-full justify-center pr-4'><Button size="xs" fullWidth title ={showCalendar ? "Hide Calendar" : "Show Calendar"} onPress={() => {setShowCalendar(!showCalendar)}} /></View>
                <View className='h-screen pt-2 w-full md:w-2/3 pr-4 sm:pr-0'>
                    <Calendars.AgendaList
                        sections={transformedData}
                        avoidDateUpdates={false}
                        scrollToNextEvent={true}
                        onEndReached={onEndReached}
                        viewOffset={0}
                        sectionStyle={{ fontSize:16, paddingBottom:12, paddingTop:12, marginHorizontal:2, marginBottom:16, color:colors.default, backgroundColor:colors.barsBackground, borderRadius:8, borderColor:colors.selectBorder, borderWidth:1, borderStyle:'solid' }}
                        renderItem={(item, firstItemInDay) => {
                            return (
                                <Link href={item.item.url}>
                                    <View className='   pl-8 pb-4 pr-2 '>
                                        <View className='absolute z-50 top-0 left-2 w-4 h-4 border-2 border-bgrbody dark:border-bgrbody-d flex-none rounded-full bg-neutral-300 dark:bg-neutral-700'></View>
                                        <View className='absolute z-10   -top-4 left-3.5 w-1 h-full  flex-none  bg-neutral-200 dark:bg-neutral-900'></View>
                                        <Card addClassName="flex-auto p-4  flex-col gap-y-2" margin="" >
                                            <Row>
                                                <View className={(item.item.cover? 'w-4/5': 'w-full') + ' gap-y-2'}>
                                                    <Text className=" text-neutral-900 dark:text-neutral-100 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base font-bold">{item.item.title}</Text>
                                                    { item.item.date_start > 0 && (
                                                        <Row className='text-center gap-x-2 items-center'> 
                                                            <Button startDecorator='CalendarCheck' size="xs"/>
                                                            <Time className="text-base text-neutral-700 dark:text-neutral-300" ts={item.item.date_start}/>
                                                            <Text className="text-base text-neutral-700 dark:text-neutral-300" >-</Text>
                                                            <Time className="text-base text-neutral-700 dark:text-neutral-300" ts={item.item.date_end}/>   
                                                        </Row>  
                                                        )
                                                    }
                                                    {item.item.location != '' && (<Row  className='text-center gap-x-2 items-center'><Button startDecorator='MapPin' size="xs"/><Text  className="text-xs text-neutral-700 dark:text-neutral-300">{item.item.location}</Text></Row>)}
                                                    <Text className="text-neutral-700 dark:text-neutral-300" numberOfLines={2}> {stripTags(item.item.description)}</Text>
                                                </View>
                                                { item.item.cover && <View className='w-1/5 mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl'>
                                                    <Image
                                                        {...item.item.cover}
                                                        view="cover"
                                                        className="u-cover"
                                                        sizes={imageSizes}
                                                    />
                                                </View>}
                                            </Row>
                                        </Card>
                                    </View>
                                </Link>
                            );
                        }}
                        renderEmptyData={() => {
                            return <View />;
                        }}
                    /></View>
                </View>
            </Calendars.CalendarProvider>
        </View>
    );
}
