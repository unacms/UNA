import GoogleMapReact from 'google-map-react';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'

export default function ElementMap({data}) {
    if (!data.location?.lat)
        return <></>

    const defaultProps = {
        center: {
          lat: data.location.lat,
          lng: data.location.lng
        },
        zoom: 14
    };

    return (
        <View className='w-full aspect-square'>
            <GoogleMapReact
                bootstrapURLKeys={{ key: appSetting('api_keys', 'google_maps') }}
                defaultCenter={defaultProps.center}
                defaultZoom={defaultProps.zoom}
            >
                <Row className='items-center'>
                    <Text className="text-3xl"><Icon icon='MapPin' /></Text>
                    <View className='bg-white p-2 rounded-2xl w-48'>
                        <Text className="text-xs">{data.caption}</Text>
                    </View>
                </Row>
            </GoogleMapReact>
        </View>
    );
}
