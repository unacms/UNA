import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useState, useRef, useCallback } from 'react';
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import Mapbox from "@rnmapbox/maps";
//TODO SMALL POINTS + desc
//https://blog.logrocket.com/building-custom-maps-react-native-mapbox/
export default function ElementMapBox({ data }) {
    Mapbox.setAccessToken("sk.eyJ1Ijoicm9tYW5sZXMiLCJhIjoiY204Zm9sMWMzMGJiaTJqcXRvdmpseHBuaiJ9.uajA_y3AmjRkBYgy4i2RdQ");
    const mapRef = useRef(null);
    const [selectedlayers, setSelectedLayers] = useState(['descendants']);
    const [popupInfo, setPopupInfo] = useState(null);

    const [viewport, setViewport] = useState({
        longitude: data.center[0],
        latitude: data.center[1],
        zoom: data.zoom
    })

    const dataSources = data.sources;

    const clickableLayers = dataSources.filter(source => selectedlayers.includes(source.key)).flatMap(source =>
        (source.layers || []).map(layer => ({
            ...layer,
            key: source.key
        }))
    )
        .filter(layer => layer.clickable === true).map(layer => layer.id);



    const infoFields = {
        'num_people_excluded': 'Number of people excluded: ',
        'sos_category': '',
        'location': 'Location: ',
        'camp': 'Camp: ',
        'pe_location': 'Pre-evacuation Location: ',
    };

    const convertLayoutToStyle = (p) => {
        if (!p) return {}; // Проверяем, что p существует

        const mapping = {
            layout: {
                'icon-image': 'iconImage',
                'icon-size': 'iconSize',
                'text-field': 'textField',
                'text-font': 'textFont',
                'text-size': 'textSize',
            },
            paint: {
                'circle-color': 'circleColor',
                'circle-radius': 'circleRadius',
                'circle-stroke-width': 'circleStrokeWidth',
                'circle-stroke-color': 'circleStrokeColor',
                'fill-color': 'fillColor',
                'fill-opacity': 'fillOpacity',
                'line-color': 'lineColor',
                'line-width': 'lineWidth',
            },
        };

        return Object.keys(mapping).reduce((style, key) => {
            if (p[key]) {
                Object.entries(mapping[key]).forEach(([sourceKey, targetKey]) => {
                    if (p[key][sourceKey] !== undefined) {
                        style[targetKey] = p[key][sourceKey];
                    }
                });
            }
            return style;
        }, {});
    };

    const handleOnPress = useCallback((event) => {
        const features = event.features;
        if (features.length > 0) {
            const feature = features[0];
            if (feature.properties.cluster_id) {
                const clusterId = feature.properties.cluster_id;
                const coordinates = feature.geometry.coordinates;
                console.log("aaaa", {
                    longitude: coordinates[0],
                    latitude: coordinates[1],
                    zoom: Math.min(viewport.zoom + 2, 18)
                })
                setViewport({
                    longitude: coordinates[0],
                    latitude: coordinates[1],
                    zoom: Math.min(viewport.zoom + 2, 18)
                })
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
        }


    }, [clickableLayers]);

    console.log("setPopupInfo", setPopupInfo)

    const layerComponents = {
        circle: Mapbox.CircleLayer,
        fill: Mapbox.FillLayer,
        line: Mapbox.LineLayer,
        symbol: Mapbox.SymbolLayer,
    };

    return (
        <View>
            <Row className="gap-x-4 my-2">
                {dataSources.map((layer, index) => (
                    <Button size="sm" key={layer.key} title={layer.name} pressed={selectedlayers.includes(layer.key)} onPress={() => selectedlayers.includes(layer.key) ? setSelectedLayers(selectedlayers.filter(name => name !== layer.key)) : setSelectedLayers([...selectedlayers, layer.key])} />
                ))}
            </Row>
            <View className="aspect-square w-full">
                <Mapbox.MapView style={{ flex: 1 }} ref={mapRef}>
                    <Mapbox.Camera
                        zoomLevel={viewport.zoom}
                        centerCoordinate={[viewport.longitude, viewport.latitude]}
                        animationMode="flyTo"
                        animationDuration={2000}
                    />
                    {selectedlayers.map((layer, index) => {
                        const lr = dataSources.find(l => l.key === layer);

                        return (
                            <Mapbox.ShapeSource key={lr.key} id={lr.key} url={lr.source} {...lr.props} onPress={handleOnPress}>
                                {lr.layers.map((layer1, index1) => {

                                    const style = convertLayoutToStyle(layer1);
                                    const LayerComponent = layerComponents[layer1.type];
                                    return <LayerComponent key={lr.key + layer1.id} id={layer1.id} filter={layer1.filter} style={style} />

                                })}

                            </Mapbox.ShapeSource>
                        )
                    })}
                    {popupInfo && (
                        <Mapbox.PointAnnotation
                            id="popup"
                            coordinate={popupInfo.coordinates}
                        >
                            <View className="bg-white p-2 rounded-lg shadow-md">
                                {popupInfo.object.link ? <Link href={popupInfo.object.link}><Text className=" text-base font-medium mb-2">{popupInfo.object.name}{popupInfo.object.facility_name}{popupInfo.object.order_name}</Text></Link> : <Text className=" text-base font-medium mb-2">{popupInfo.object.name}{popupInfo.object.facility_name}{popupInfo.object.order_name}</Text>}
                                {Object.entries(popupInfo.object)
                                    .filter(([key]) => Object.keys(infoFields).includes(key)) // Убираем ненужные ключи
                                    .map(([key, value]) => (
                                        <Text key={key} className="mb-2">
                                            {infoFields[key]}{value}
                                        </Text>
                                    ))}
                                <Text className=" text-xs">{popupInfo.object.description}{popupInfo.object.facility_description}</Text>
                            </View>
                        </Mapbox.PointAnnotation>
                    )}
                </Mapbox.MapView>
            </View>
        </View>

    )
}
