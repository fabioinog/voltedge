/**
 * Map Bounds Component
 * Restricts map view to Sudan boundaries
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Sudan boundaries - Southwest and Northeast corners
const SUDAN_BOUNDS = [
  [8.0, 22.0], // Southwest corner (lat, lng)
  [22.0, 39.0], // Northeast corner (lat, lng)
];

const MapBounds = () => {
  const map = useMap();

  useEffect(() => {
    if (map && typeof window !== 'undefined') {
      const L = require('leaflet');
      
      // Create bounds using Leaflet's LatLngBounds
      const sudanBounds = L.latLngBounds(SUDAN_BOUNDS);
      
      // Set max bounds to restrict view to Sudan
      map.setMaxBounds(sudanBounds);
      map.setMinZoom(5);
      map.setMaxZoom(12);
      
      // Prevent dragging outside bounds
      map.on('drag', () => {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        
        // Check if outside Sudan bounds
        if (
          sw.lat < SUDAN_BOUNDS[0][0] ||
          sw.lng < SUDAN_BOUNDS[0][1] ||
          ne.lat > SUDAN_BOUNDS[1][0] ||
          ne.lng > SUDAN_BOUNDS[1][1]
        ) {
          // Pan back to center of Sudan
          map.panTo([15.5, 30.0], { animate: false });
        }
      });
    }
  }, [map]);

  return null;
};

export default MapBounds;
