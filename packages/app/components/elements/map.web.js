import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view';
import { BlockWrapper } from 'app/components/block-wrapper';

export default function ElementMap({ data, blockWrapperProps }) {
    const center = { lat: data.location.lat, lng: data.location.lng };
    const apiKey = appSetting('config', 'api_keys', 'google_maps');

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className='w-full aspect-square p-2'>
                <View className='rounded-lg overflow-hidden w-full aspect-square' style={{ minHeight: 200 }}>
                    <APIProvider apiKey={apiKey}>
                        <Map
                            defaultCenter={center}
                            defaultZoom={14}
                            mapTypeControl={true}
                            fullscreenControl={true}
                        >
                            <Marker position={center} />
                        </Map>
                    </APIProvider>
                </View>
            </View>
        </BlockWrapper>
    );
}