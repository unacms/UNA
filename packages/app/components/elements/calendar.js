import { Text } from 'app/design/typography'
import { Agenda, calendarTheme } from 'react-native-calendars';
import { View, Row } from 'app/design/view'

import Link from 'app/ui/atoms/link'
import { fetcher } from '../../lib/fetcher';
import { useEffect, useState } from 'react';

export default function ElementCalendar({data}) {
    const [cdata, setData] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await fetcher('/api.php?r='+data.request_url);
            setData(sResponse.data);
            console.log(sResponse, data.request_url)
        };
        fetchData();
    }, []);
    console.log('cdata', cdata)
    function transformToCalendarFormat(data) {
        const items = {};
    
        data.forEach(event => {
            // Convert start date to YYYY-MM-DD format
            const date = new Date(event.start).toISOString().split('T')[0];
    
            // Create an array for this date if it doesn't exist
            if (!items[date]) {
                items[date] = [];
            }
    
            // Add event data to the array for this date
            items[date].push(event);
        });
    
        return { items };
    }
    if (!cdata)
        return <></>;
        
    const transformedData = transformToCalendarFormat(cdata);

    return (
        <Agenda
            items={transformedData.items}
            renderItem={(item, firstItemInDay) => {
                return <View><Link href={item.url}><Text>{item.title} {item.description} {item.start} {item.end} {item.location}</Text></Link></View>;
            }}
            renderEmptyData={() => {
                return <View />;
            }}
        />
    );
}
