
import { View } from 'app/design/view'
import { useRef } from 'react';

//import Mapbox from "@rnmapbox/maps";

export default function ElementMap({ data, height }) {
    return <></>
    /*if (!data.location?.lat)
        return <></>

    Mapbox.setAccessToken("sk.eyJ1Ijoicm9tYW5sZXMiLCJhIjoiY204Zm9sMWMzMGJiaTJqcXRvdmpseHBuaiJ9.uajA_y3AmjRkBYgy4i2RdQ");

    const mapRef = useRef(null);

    return (
        <View className='w-full aspect-square' style={{ height: height }}>
            <Mapbox.MapView style={{ flex: 1 }} ref={mapRef}  styleURL="mapbox://styles/mapbox/light-v11">
                <Mapbox.Camera
                    zoomLevel={14}
                    centerCoordinate={[data.location.lng, data.location.lat]}
                    animationMode="flyTo"
                    animationDuration={2000}
                />


            </Mapbox.MapView>
        </View>
    );*/
}
