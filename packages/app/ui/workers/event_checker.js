import { View, Row } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import * as Location from 'expo-location';
import Card from 'app/ui/molecules/card'
import { stripTags } from 'app/lib/util';
import { Button } from 'app/design/controls';
import Image from 'app/ui/atoms/image'
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link'
import { getImageSizes } from 'app/lib/util'
import { Text } from 'app/design/typography'

const getGeo =  async () => { 
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
    }
    return await Location.getCurrentPositionAsync({})
};

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

export default function WorkerEventChecker(oProps) {
    const threshold = 1500;
    const [data, setData] = useState(false);
    const [local, setLocal] = useState(false);
    let { currentUser, setCurrentUser } = useCurrentUser();
    let forgottedEvents = currentUser?.settings?.forgotted_events ? currentUser.settings.forgotted_events : [];

    useEffect(() => {
        const fetchData = async () => {
            let request_url = "/api.php?r=bx_events/calendar_data&params[]={%22params%22:{%22profile_id%22:%22{profile_id}%22,%22type%22:%22joined%22,%22start%22:1698578064,%22end%22:1703848464}}";
            const sResponse = await fetcher(request_url);
            setData(sResponse);
        };
        if (currentUser)
            fetchData();
    }, [currentUser]);
    
    useEffect(() => {
        const fetchLocation = async () => {
            const geo = await getGeo();
            setLocal(geo);
        }
        fetchLocation();
    }, []);

    const ForgotEvent  = async (eventId) => { 
        forgottedEvents.push(eventId)
        if (!currentUser.settings)
            currentUser.settings = {}
        currentUser.settings.forgotted_events = forgottedEvents
        let request_url = '/api.php?r=system/update_settings/TemplServiceProfiles&params[]={user_id}&params[]='.replace('{user_id}', currentUser.id)+JSON.stringify(currentUser.settings);
        await fetcher(request_url);
    };

    let content =<></>

    if (!data || !local)
        return content

    let filteredData = data.data.filter(event => 
            event.location_data && 
            event.location_data.lat != null && 
            !forgottedEvents.includes(event.id)
    );
    const imageSizes = getImageSizes()

    filteredData.forEach((item, key) => {
        let d = getDistance(item.location_data.lat, item.location_data.lng, local.coords.latitude, local.coords.longitude)
        if (d < threshold){
            content = (<Modal title="You are on event" onVisible={true} >
                <View className='w-full  '>
                    <Card addClassName="flex-auto p-4  flex-col gap-y-2" margin="" >
                        <Row>
                            <View className='w-4/5'>
                                <Text className=" text-neutral-900 dark:text-neutral-100 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base font-bold">{item.title}</Text>
                                <Row className='text-center gap-x-2 items-center'> 
                                    <Button startDecorator='CalendarCheck' size="xs"/>
                                    <Time className="text-base text-neutral-700 dark:text-neutral-300" ts={item.date_start}/>
                                    <Text className="text-base text-neutral-700 dark:text-neutral-300" >-</Text>
                                    <Time className="text-base text-neutral-700 dark:text-neutral-300" ts={item.date_end}/>
                                </Row>
                                {item.location != '' && (<Row  className='text-center gap-x-2 items-center'><Button startDecorator='MapPin' size="xs"/><Text  className="text-xs text-neutral-700 dark:text-neutral-300">{item.location}</Text></Row>)}
                                <Text className="text-neutral-700 dark:text-neutral-300" numberOfLines={2}> {stripTags(item.description)}</Text>
                            </View>
                            <View className='w-1/5 mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl'>
                            <Image
                                {...item.cover}
                                view="cover"
                                className="u-cover"
                                sizes={imageSizes}
                            />
                            </View>
                        </Row>
                        <Row className='justify-between'>
                            <Link href={item.url}><Button onPress={() => ForgotEvent(item.id)}  title='Check In' size="base" variant="primary"/></Link>
                            <Button title='Forgot' size="base" onPress={() => ForgotEvent(item.id)} />
                        </Row>
                    </Card>
                </View>
            </Modal>)
        }
    })
   
    return content;
}
