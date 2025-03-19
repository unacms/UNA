import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useState, useRef, useCallback } from 'react';
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import Map, { Source, Layer, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

/* [
        {
            key: 'incarcerees',
            name: 'Incarcerees',
            source: 'https://ci.una.io/test3/m/invites/get_map_box_data/incarcerees/',
            props: {
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            },
            layers: [
                {
                    clickable: true,
                    id: 'incarcerees-clusters',
                    type: 'circle',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bbd6',
                            100,
                            '#f1f075',
                            200,
                            '#f28cb1'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            100,
                            30,
                            200,
                            40
                        ],
                        circleOpacity: 0.6,
                    }
                },
                {
                    id: 'incarcerees-clusters-count',
                    type: 'symbol',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                    }
                },
                {
                    clickable: true,
                    id: 'incarcerees-unclustered-point',
                    type: 'circle',
                    filter: ['!', ['has', 'point_count']],

                    paint: {
                        'circle-color': '#11b4da',
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                }
            ]
        },
        {
            key: 'descendants',
            name: 'Descendants',
            source: 'https://ci.una.io/test3/m/invites/get_map_box_data/descendants/',
            props: {
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            },
            layers: [
                {
                    clickable: true,
                    id: 'descendants-clusters',
                    type: 'circle',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bb72',
                            100,
                            '#f12875',
                            200,
                            '#f28cf7'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            100,
                            30,
                            200,
                            40
                        ],
                        circleOpacity: 0.6,
                    }
                },
                {
                    id: 'descendants-clusters-count',
                    type: 'symbol',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                    }
                },
                {
                    clickable: true,
                    id: 'descendants-unclustered-point',
                    type: 'circle',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': '#5eeb9a',
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                }
            ]

        },
        {
            key: 'facilities',
            name: 'Facilities',
            source: 'https://ci.una.io/test3/m/invites/get_map_box_data/facilities/',
            props: {
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            },
            layers: [
                {
                    clickable: true,
                    id: 'facilities-clusters',
                    type: 'circle',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bbd6',
                            5,
                            '#f1f075',
                            10,
                            '#f28cb1'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            5,
                            30,
                            10,
                            40
                        ],
                        circleOpacity: 0.6,
                    }
                },
                {
                    id: 'facilities-clusters-count',
                    type: 'symbol',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                    }
                },
                {
                    clickable: true,
                    id: 'facilities-unclustered-point',
                    type: 'symbol',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'icon-image': 'embassy',
                        'icon-color': '#000000',
                        'icon-halo-color': '#000000',
                        'icon-size': 1.5,
                    }
                }
            ]
        },
        {
            key: 'exclusion',
            name: 'Exclusion Zone',
            source: 'https://ci.una.io/test3/m/invites/get_map_box_data/exclusion/',
            layers: [
                {
                    clickable: true,
                    id: 'exclusion',
                    type: 'fill',
                    paint: {
                        'fill-color': '#0080ff',
                        'fill-opacity': 0.5
                    }
                },
                {
                    id: 'exclusion-outline',
                    type: 'line',
                    paint: {
                        'line-color': '#000',
                        'line-width': 1
                    }
                }
            ]
        },
    ]
        */

export default function ElementMapBox({ data }) {
    const mapRef = useRef(null);
    const [selectedlayers, setSelectedLayers] = useState(['descendants']);
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
        <View>
            <Row className="gap-x-4 my-2">
                {dataSources.map((layer, index) => (
                    <Button size="sm" key={layer.key} title={layer.name} pressed={selectedlayers.includes(layer.key)} onPress={() => selectedlayers.includes(layer.key) ? setSelectedLayers(selectedlayers.filter(name => name !== layer.key)) : setSelectedLayers([...selectedlayers, layer.key])} />
                ))}
            </Row>
            <View className="aspect-square w-full">
                <Map
                    ref={mapRef}
                    mapboxAccessToken="pk.eyJ1Ijoicm9tYW5sZXMiLCJhIjoiY204Zm9kY3ByMGE4bzJrc2R6Zzg4NW0zMCJ9.Jme_Zudsug5mmqcbjII9cQ"
                    initialViewState={viewport}
                    style={{ flex: 1 }}
                    mapStyle="mapbox://styles/mapbox/light-v11"
                    onClick={onMapClick}
                >

                    {selectedlayers.map((layer, index) => {
                        const lr = dataSources.find(l => l.key === layer);
                        return (
                            <Source
                                key={lr.key}
                                id={lr.key}
                                type="geojson"
                                data={lr.source}
                                {...lr.props}
                            >
                                {lr.layers.map((layer1, index1) => {
                                    return <Layer key={lr.key+layer1.id} {...layer1} />
                                })}

                            </Source>
                        )
                    })}
                    {popupInfo && (
                        <Popup
                            longitude={popupInfo.coordinates[0]}
                            latitude={popupInfo.coordinates[1]}
                            closeButton={true}
                            closeOnClick={false}
                            onClose={() => setPopupInfo(null)}
                            anchor="top"
                        >
                            <View>
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
                        </Popup>
                    )}
                </Map>
            </View>
        </View>
    )
}
