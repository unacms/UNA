import React, { lazy, Suspense } from 'react';
import { appSetting } from 'app/lib/util'
import 'mapbox-gl/dist/mapbox-gl.css';
import { View } from 'app/design/view'

const Map = lazy(() => import('react-map-gl/mapbox'));

export default function ElementMap({ data, height }) {
    return <View className='w-full aspect-square'  >
        <Suspense fallback={<View></View>}>
            <Map
                style={{ flex: 1 }}
                // https://visgl.github.io/react-map-gl/docs/get-started/mapbox-tokens
                mapboxAccessToken={appSetting('config', 'api_keys', 'mapbox')}
                initialViewState={{
                    longitude: data.location.lng,
                    latitude: data.location.lat,
                    zoom: 14
                }}

                mapStyle="mapbox://styles/mapbox/streets-v9"
            />
        </Suspense>
    </View>
}
