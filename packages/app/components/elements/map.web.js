//import GoogleMapReact from 'google-map-react';
import { appSetting } from 'app/lib/util'
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { View } from 'app/design/view'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementMap({ data, blockWrapperProps }) {
    return (
        <BlockWrapper {...blockWrapperProps}><View className='w-full aspect-square'  >
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
            /></View>
        </BlockWrapper>
    )
}
