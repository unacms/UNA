import GoogleMapReact from 'google-map-react';
import { appSetting } from 'app/lib/util'
import { View } from 'app/design/view'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementMap({ data, blockWrapperProps }) {
    const center = { lat: data.location.lat, lng: data.location.lng };
    const apiKey = appSetting('config', 'api_keys', 'google_maps');

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className='w-full aspect-square p-2'>
                <View className='rounded-lg overflow-hidden w-full aspect-square' style={{ minHeight: 200 }}>
                    <GoogleMapReact
                        bootstrapURLKeys={{ key: apiKey }}
                        defaultCenter={center}
                        defaultZoom={14}
                        options={{ mapTypeControl: true, fullscreenControl: true }}
                    />
                </View>
            </View>
        </BlockWrapper>
    )
}