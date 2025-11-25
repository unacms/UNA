import { useRef, useEffect } from 'react';

import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view';

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

    if (mapboxPromise) {
        return mapboxPromise;
    }

    mapboxPromise = new Promise((resolve, reject) => {
        // CSS — просто подключаем, ждать его необязательно
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

export default function ElementMap({ data, height }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        if (!containerRef.current) return;

        loadMapboxAssets()
            .then((mapboxgl) => {
                if (cancelled || !containerRef.current || !mapboxgl) return;

                const token = appSetting('config', 'api_keys', 'mapbox');

                mapRef.current = new mapboxgl.Map({
                    container: containerRef.current,
                    accessToken: token,
                    style: 'mapbox://styles/mapbox/streets-v9',
                    center: [data.location.lng, data.location.lat],
                    zoom: 14,
                });
            })
            .catch((err) => {
                console.error('Failed to load Mapbox:', err);
            });

        return () => {
            cancelled = true;
            if (mapRef.current && mapRef.current.remove) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // если нужно реагировать на смену координат — можно добавить data.location.*

    return (
        <View
            className="w-full aspect-square"
            style={height ? { height } : undefined}
        >
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%' }}
            />
        </View>
    );
}
