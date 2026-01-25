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

const MapBounds = ({ isSimulating }) => {
  const map = useMap();

  useEffect(() => {
    if (map && typeof window !== 'undefined') {
      // Completely disable bounds during simulation to allow free movement
      if (isSimulating) {
        // Explicitly remove all bounds restrictions - no walls, no limits
        map.setMaxBounds(null);
        map.options.maxBounds = null;
        // Remove any event listeners that might restrict movement
        map.off('drag');
        map.setMinZoom(5);
        map.setMaxZoom(19);
      } else {
        // Only restrict bounds when not simulating
        const L = require('leaflet');
        const sudanBounds = L.latLngBounds(SUDAN_BOUNDS);
        map.setMaxBounds(sudanBounds);
        map.setMinZoom(5);
        map.setMaxZoom(19);
      }
    }
  }, [map, isSimulating]);

  return null;
};

export default MapBounds;
