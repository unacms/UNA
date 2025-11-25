import React, { useState } from 'react';

import { appSetting } from 'app/lib/util'
import { View } from 'app/design/view'
import { Button } from 'app/design/controls'

export default function ElementMap({ data, height }) {
  const [MapComponent, setMapComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    if (MapComponent || isLoading) return;

    setIsLoading(true);
    try {
      // грузим JS + CSS ОТДЕЛЬНЫМ чанком
      const [{ Map: MapOrDefault, default: DefaultExport }] = await Promise.all([
        import('react-map-gl/mapbox'),
        import('mapbox-gl/dist/mapbox-gl.css'),
      ]);

      const Comp = MapOrDefault || DefaultExport;
      setMapComponent(() => Comp);
    } catch (err) {
      console.error('Failed to load Mapbox component:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className="w-full aspect-square"
      style={height ? { height } : undefined}
    >
      <Button
        variant="text"
        startDecorator="Folder"
        title={MapComponent ? 'Карта загружена' : 'Загрузить карту'}
        onPress={handleLoad}
        disabled={isLoading}
      />

      {MapComponent && (
        <MapComponent
          style={{ flex: 1 }}
          mapboxAccessToken={appSetting('config', 'api_keys', 'mapbox')}
          initialViewState={{
            longitude: data.location.lng,
            latitude: data.location.lat,
            zoom: 14,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v9"
        />
      )}
    </View>
  );
}
