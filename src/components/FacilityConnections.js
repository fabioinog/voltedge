/**
 * Facility Connections Component
 * Renders connection lines between facilities on the map
 */

import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

let L = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

/**
 * Facility Connections Component
 * Draws lines between connected facilities with color coding
 */
const FacilityConnections = ({ connections, topPriorityFacilities }) => {
  const map = useMap();
  const polylinesRef = React.useRef([]);

  useEffect(() => {
    if (!map || !L || !connections || !Array.isArray(connections) || connections.length === 0) {
      return;
    }

    // Clear existing polylines
    polylinesRef.current.forEach((polyline) => {
      map.removeLayer(polyline);
    });
    polylinesRef.current = [];

    // Draw connection lines
    connections.forEach((connection) => {
      // Validate connection data
      if (!connection || !connection.from || !connection.to) {
        console.warn('Invalid connection data:', connection);
        return;
      }

      const fromLat = connection.from.lat;
      const fromLng = connection.from.lng;
      const toLat = connection.to.lat;
      const toLng = connection.to.lng;

      // Validate coordinates are valid numbers
      if (
        typeof fromLat !== 'number' || isNaN(fromLat) ||
        typeof fromLng !== 'number' || isNaN(fromLng) ||
        typeof toLat !== 'number' || isNaN(toLat) ||
        typeof toLng !== 'number' || isNaN(toLng)
      ) {
        console.warn('Invalid coordinates in connection:', {
          from: { lat: fromLat, lng: fromLng },
          to: { lat: toLat, lng: toLng },
          connection
        });
        return;
      }

      // Determine color
      let color = '#00ff00'; // Default green
      let weight = 2;
      let opacity = 0.6;

      // Get top 3 facility IDs
      const topPriorityIds = topPriorityFacilities
        ? topPriorityFacilities.slice(0, 3).map(f => f.id)
        : [];

      // Check if either facility is in top 3 (at risk)
      const isAtRisk = 
        topPriorityIds.includes(connection.from.id) || 
        topPriorityIds.includes(connection.to.id);

      // Check if either facility is failed
      const isFailed = 
        connection.from.status === 'failed' || 
        connection.to.status === 'failed';

      // Color logic
      if (isFailed) {
        color = '#ff0000'; // Red (for future implementation)
        weight = 3;
        opacity = 0.8;
      } else if (isAtRisk) {
        color = '#ffff00'; // Yellow (at risk - top 3 priority)
        weight = 2.5;
        opacity = 0.7;
      } else {
        color = '#00ff00'; // Green (default - working fine)
        weight = 2;
        opacity = 0.6;
      }

      // Create polyline
      const polyline = L.polyline(
        [[fromLat, fromLng], [toLat, toLng]],
        {
          color: color,
          weight: weight,
          opacity: opacity,
          smoothFactor: 1,
        }
      );

      polyline.addTo(map);
      polylinesRef.current.push(polyline);
    });

    // Cleanup function
    return () => {
      polylinesRef.current.forEach((polyline) => {
        map.removeLayer(polyline);
      });
      polylinesRef.current = [];
    };
  }, [map, connections, topPriorityFacilities]);

  return null; // This component doesn't render anything visible
};

export default FacilityConnections;
