
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native'
import { useState, useRef, useEffect } from 'react';
import { Button } from 'app/design/controls';

export default function ElementMap({ data, height }) {
    if (!data.location?.lat)
        return <></>


    const mapRef = useRef(null);

    const defaultRegion = {
        latitude: data.location.lat,
        longitude: data.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    useEffect(() => {
        if (mapRef.current) {
            console.log("mapRef.current", mapRef.current)
            mapRef.current.animateToRegion(defaultRegion, 100);
        }
    }, [mapRef.current, defaultRegion])

    return (
        <View className='w-full aspect-square' style={{ height: height }}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={defaultRegion}
              
            >
                <Marker coordinate={defaultRegion} />
            </MapView>
        </View>
    );
}
