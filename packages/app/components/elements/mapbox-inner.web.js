import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import { appSetting } from 'app/lib/util';

const MAPBOX_JS = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.js';
const MAPBOX_CSS = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css';

// один общий промис на весь модуль
let mapboxPromise = null;

function loadMapboxAssets() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('window is undefined'));
    }

    if (window.mapboxgl) {
        return Promise.resolve(window.mapboxgl);
    }

    if (mapboxPromise) return mapboxPromise;

    mapboxPromise = new Promise((resolve, reject) => {
        // CSS просто подключаем
        if (!document.querySelector(`link[href="${MAPBOX_CSS}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = MAPBOX_CSS;
            document.head.appendChild(link);
        }

        const existingScript = document.querySelector(
            `script[src="${MAPBOX_JS}"]`
        );

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.mapboxgl));
            existingScript.addEventListener('error', reject);
            return;
        }

        const script = document.createElement('script');
        script.src = MAPBOX_JS;
        script.async = true;

        script.onload = () => resolve(window.mapboxgl);
        script.onerror = reject;

        document.body.appendChild(script);
    });

    return mapboxPromise;
}

export default function ElementMapBox({
    selectedlayers,
    dataSources,
    viewport,
    mapRef,
    popupInfo,
    onMapClick,
    infoFields,
    onPopupClose, // <--- новый проп, чтобы закрывать попап
}) {
    const containerRef = useRef(null);
    const innerMapRef = useRef(null); // на случай, если mapRef не передали
    const addedSourcesRef = useRef(new Set());
    const addedLayersRef = useRef(new Set());
    const popupRef = useRef(null);

    const getMapInstance = () => {
        if (mapRef && mapRef.current) return mapRef.current;
        return innerMapRef.current;
    };

    // инициализация карты
    useEffect(() => {
        let cancelled = false;
        let mapInstance = null;

        if (!containerRef.current) return;

        loadMapboxAssets()
            .then((mapboxgl) => {
                if (cancelled || !containerRef.current) return;

                const token = appSetting('config', 'api_keys', 'mapbox');
                mapboxgl.accessToken = token;

                const center = [
                    viewport.longitude ?? viewport.lng,
                    viewport.latitude ?? viewport.lat,
                ];

                mapInstance = new mapboxgl.Map({
                    container: containerRef.current,
                    style: 'mapbox://styles/mapbox/light-v11',
                    center,
                    zoom: viewport.zoom ?? 10,
                    bearing: viewport.bearing ?? 0,
                    pitch: viewport.pitch ?? 0,
                });

                if (mapRef) {
                    mapRef.current = mapInstance;
                } else {
                    innerMapRef.current = mapInstance;
                }

                if (onMapClick) {
                    mapInstance.on('click', (evt) => {
                        onMapClick(evt);
                    });
                }
            })
            .catch((err) => {
                console.error('Failed to load Mapbox:', err);
            });

        return () => {
            cancelled = true;

            // чистим попап
            if (popupRef.current) {
                popupRef.current.remove();
                popupRef.current = null;
            }

            const map = getMapInstance();
            if (map) {
                map.remove();
            }

            if (mapRef) {
                mapRef.current = null;
            } else {
                innerMapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // карта создаётся один раз

    // helper: обновление источников и слоёв
    useEffect(() => {
        const map = getMapInstance();
        if (!map) return;

        const applyLayers = () => {
            // удалить старые слои
            addedLayersRef.current.forEach((layerId) => {
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
            });
            addedLayersRef.current.clear();

            // удалить старые source
            addedSourcesRef.current.forEach((sourceId) => {
                if (map.getSource(sourceId)) {
                    map.removeSource(sourceId);
                }
            });
            addedSourcesRef.current.clear();

            // добавить новые по selectedlayers
            selectedlayers.forEach((layerKey) => {
                const lr = dataSources.find((l) => l.key === layerKey);
                if (!lr) return;

                if (!map.getSource(lr.key)) {
                    map.addSource(lr.key, {
                        type: 'geojson',
                        data: lr.source,
                        ...(lr.props || {}),
                    });
                    addedSourcesRef.current.add(lr.key);
                }

                (lr.layers || []).forEach((layerDef) => {
                    const id = layerDef.id || `${lr.key}-${Math.random()}`;
                    const def = {
                        ...layerDef,
                        id,
                        source: lr.key,
                    };

                    if (!map.getLayer(id)) {
                        map.addLayer(def);
                        addedLayersRef.current.add(id);
                    }
                });
            });
        };

        if (map.isStyleLoaded()) {
            applyLayers();
        } else {
            map.once('load', applyLayers);
        }
    }, [selectedlayers, dataSources]);

    // helper: попап
    useEffect(() => {
        const map = getMapInstance();
        if (!map) return;

        // удалить старый попап, если есть
        if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
        }

        if (!popupInfo) return;

        const { coordinates, object } = popupInfo;
        if (!coordinates || coordinates.length < 2) return;

        const popupContainer = document.createElement('div');

        // рендерим React-контент внутрь DOM-узла попапа
        ReactDOM.render(
            <View>
                {object.link ? (
                    <Link href={object.link}>
                        <Text className="text-base font-medium mb-2">
                            {object.name}
                            {object.facility_name}
                            {object.order_name}
                        </Text>
                    </Link>
                ) : (
                    <Text className="text-base font-medium mb-2">
                        {object.name}
                        {object.facility_name}
                        {object.order_name}
                    </Text>
                )}

                {Object.entries(object)
                    .filter(([key]) => Object.prototype.hasOwnProperty.call(infoFields, key))
                    .map(([key, value]) => (
                        <Text key={key} className="mb-2">
                            {infoFields[key]}
                            {value}
                        </Text>
                    ))}

                <Text className="text-xs">
                    {object.description}
                    {object.facility_description}
                </Text>
            </View>,
            popupContainer
        );

        const mapboxgl = window.mapboxgl;
        if (!mapboxgl) return;

        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            anchor: 'top',
        })
            .setLngLat([coordinates[0], coordinates[1]])
            .setDOMContent(popupContainer)
            .addTo(map);

        if (onPopupClose) {
            popup.on('close', () => {
                onPopupClose();
            });
        }

        popupRef.current = popup;

        return () => {
            if (popupRef.current) {
                popupRef.current.remove();
                popupRef.current = null;
            }
        };
    }, [popupInfo, infoFields, onPopupClose]);

    return (
        <View className="w-full" style={{ flex: 1 }}>
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%' }}
            />
        </View>
    );
}
