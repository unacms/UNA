import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
//import Map, { Source, Layer, Popup } from 'react-map-gl/mapbox';
//import 'mapbox-gl/dist/mapbox-gl.css';
import { appSetting } from 'app/lib/util'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementMapBox({ selectedlayers, dataSources, viewport, mapRef, popupInfo, onMapClick, infoFields, blockWrapperProps }) {
    return <></>
   /* return (
        <BlockWrapper {...blockWrapperProps}>
            <Map
                ref={mapRef}
                mapboxAccessToken={appSetting('config', 'api_keys', 'mapbox')}
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
                                return <Layer key={lr.key + layer1.id} {...layer1} />
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
                                .filter(([key]) => Object.keys(infoFields).includes(key)) // Drop keys not in infoFields
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
        </BlockWrapper>
    )*/
}
