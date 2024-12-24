//import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps'; //EXPO 52 UPDATE
// 
import { Text } from 'app/design/typography'
import { StyleSheet } from 'react-native'
import { View, Row } from 'app/design/view'
import { useState } from 'react';
import { Icon } from 'app/ui/atoms/icon'

export default function ElementMap({data}) {

    return <>TODO</>
   /* const tokyoRegion = {
        latitude: 35.6762,
        longitude: 139.6503,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    const [place, setPlace] = useState(tokyoRegion);
    //TODO
    if (!data.location?.lat)
        return <></>

        const styles = StyleSheet.create({
            container: {
              ...StyleSheet.absoluteFillObject,
              height: 400,
              width: 400,
              justifyContent: 'flex-end',
              alignItems: 'center',
            },
            map: {
              ...StyleSheet.absoluteFillObject,
            },
           });

    const tokyoRegion1 = {
        latitude: 35.6762,
        longitude: 139.6503,
    };

    return (
        <View className='w-full h-96 ' >

            <MapView
                 provider={PROVIDER_GOOGLE} 
                style={styles.map}
                initialRegion={place}
                region={{
                    latitude: data.location.lat,
                    longitude: data.location.lng,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                  }}
                onRegionChange = {(region) => setPlace(region)}
            >
               <Marker 
                    title={data.caption}
                    //description={data.caption}
                    coordinate={{latitude: data.location.lat, longitude: data.location.lng}} 
               >
               </Marker>
            </MapView>

        </View>
    );*/
}
