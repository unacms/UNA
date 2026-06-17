import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view';
import { BlockWrapper } from 'app/components/block-wrapper';

export default function ElementMap({ data, blockWrapperProps }) {
    const apiKey = appSetting('config', 'api_keys', 'google_maps');

    // Without a location or a configured API key the map would render a broken,
    // watermarked tile and emit ApiProjectMapError, so skip rendering instead.
    if (!data.location?.lat || !apiKey)
        return null;

    const center = { lat: data.location.lat, lng: data.location.lng };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className='w-full aspect-square'>
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