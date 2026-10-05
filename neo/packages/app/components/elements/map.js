import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform } from 'react-native';
import { View } from 'app/design/view'
import { BlockWrapper } from 'app/components/block-wrapper'

// Requires development build (not Expo Go). Android: add apiKey to app.json android.config.googleMaps.apiKey
export default function ElementMap({ data, height, blockWrapperProps }) {
    if (!data.location?.lat)
        return <></>

    const cameraPosition = {
        coordinates: { latitude: data.location.lat, longitude: data.location.lng },
        zoom: 14,
    };

    const mapStyle = { flex: 1 };

    if (Platform.OS === 'ios') {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <View className='w-full aspect-square' style={{ height }}>
                    <AppleMaps.View style={mapStyle} cameraPosition={cameraPosition} />
                </View>
            </BlockWrapper>
        );
    }
    if (Platform.OS === 'android') {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <View className='w-full aspect-square' style={{ height }}>
                    <GoogleMaps.View style={mapStyle} cameraPosition={cameraPosition} />
                </View>
            </BlockWrapper>
        );
    }
    return null;
}