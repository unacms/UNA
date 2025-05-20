import { View, Row } from 'app/design/view'
import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { Button } from 'app/design/controls'
import Loading from 'app/ui/atoms/loading'
const MapComponent = lazy(() => import('app/components/elements/mapbox-inner'));

export default function ElementMapBox({ data }) {
    const mapRef = useRef(null);
    const [selectedlayers, setSelectedLayers] = useState(['incarcerees']);
    const [popupInfo, setPopupInfo] = useState(null); // Данные для popup
    const viewport = {
        longitude: data.center[0],
        latitude: data.center[1],
        zoom: data.zoom
    }

    const dataSources = data.sources;
   
    const clickableLayers = dataSources.filter(source => selectedlayers.includes(source.key)).flatMap(source =>
        (source.layers || []).map(layer => ({
            ...layer,
            key: source.key
        }))
    )
        .filter(layer => layer.clickable === true).map(layer => layer.id);

    const onMapClick = useCallback((event) => {
        const map = mapRef.current.getMap();
        const features = map.queryRenderedFeatures(event.point, { layers: clickableLayers });

        if (features.length > 0) {
            const feature = features[0];
            if (feature.properties.cluster_id) {
                const clusterId = feature.properties.cluster_id;
                const coordinates = feature.geometry.coordinates;
                map.getSource(feature.source).getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err) return;

                    map.flyTo({
                        center: coordinates,
                        zoom: zoom,
                        essential: true,
                        speed: 1.2,
                        curve: 1,
                    });
                });
            }
            else {

                if (feature.geometry.type == "Point") {
                    const coordinates = feature.geometry.coordinates.slice();
                    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    setPopupInfo({
                        coordinates: coordinates,
                        object: feature.properties,
                    });
                }
                if (feature.geometry.type == "Polygon") {
                    const coordinates = feature.geometry.coordinates[0][0];

                    setPopupInfo({
                        coordinates: coordinates,
                        object: feature.properties,
                    });
                }
            }
        } else {
            setPopupInfo(null);
        }
    }, [clickableLayers]);

    const infoFields = {
        'num_people_excluded': 'Number of people excluded: ',
        'sos_category': '',
        'location': 'Location: ',
        'camp': 'Camp: ',
        'pe_location': 'Pre-evacuation Location: ',
    };

    return (
        <View className=" items-center">
            <Row className="gap-x-4 my-2">
                {dataSources.map((layer, index) => (
                    <Button size="sm" key={layer.key} title={layer.name} pressed={selectedlayers.includes(layer.key)} onPress={() => selectedlayers.includes(layer.key) ? setSelectedLayers(selectedlayers.filter(name => name !== layer.key)) : setSelectedLayers([...selectedlayers, layer.key])} />
                ))}
            </Row>
            <View className="aspect-square w-full max-w-3xl ">
                <Suspense fallback={<Loading className="absolute" />}><MapComponent 
                    mapRef={mapRef} 
                    dataSources={dataSources}
                    viewport={viewport} 
                    onMapClick={onMapClick} 
                    selectedlayers={selectedlayers} 
                    popupInfo={popupInfo} 
                    infoFields={infoFields}
                />
                </Suspense>
            </View>
        </View>
    )
}
