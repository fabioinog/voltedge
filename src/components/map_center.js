/**
 * Map Center Component
 * Centers map when simulation starts, then follows user during movement
 * Uses panBy with requestAnimationFrame to prevent tile reloads (no grey flash)
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const MapCenter = ({ center, isSimulating }) => {
  const map = useMap();
  const hasInitializedRef = useRef(false);
  const lastCenterRef = useRef(null);
  const centerRef = useRef(center);
  const rafIdRef = useRef(null);

  // Keep center ref updated without triggering effect
  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    if (!centerRef.current || centerRef.current.length !== 2) return;

    // When simulation starts, center and zoom in closer
    if (isSimulating && !hasInitializedRef.current) {
      console.log('MapCenter: Initializing - centering on user location:', centerRef.current, 'zoom: 19');
      map.setView(centerRef.current, 19, { animate: true, duration: 0.5 });
      hasInitializedRef.current = true;
      lastCenterRef.current = centerRef.current;
      return;
    }

    // During simulation, use requestAnimationFrame to batch panBy calls
    if (isSimulating && hasInitializedRef.current) {
      // Cancel any pending animation frame
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Schedule pan update for next frame (batched, smooth)
      rafIdRef.current = requestAnimationFrame(() => {
        if (!lastCenterRef.current || !centerRef.current) {
          rafIdRef.current = null;
          return;
        }
        
        const [lastLat, lastLng] = lastCenterRef.current;
        const [currentLat, currentLng] = centerRef.current;
        
        // Only pan if location actually changed
        if (Math.abs(lastLat - currentLat) > 0.0001 || Math.abs(lastLng - currentLng) > 0.0001) {
          // Use panBy for incremental movements - prevents tile reloads (no grey flash)
          try {
            const lastPoint = map.latLngToContainerPoint([lastLat, lastLng]);
            const currentPoint = map.latLngToContainerPoint([currentLat, currentLng]);
            const offsetX = currentPoint.x - lastPoint.x;
            const offsetY = currentPoint.y - lastPoint.y;
            
            // Pan by offset - smooth movement without tile reload
            if (Math.abs(offsetX) > 0.1 || Math.abs(offsetY) > 0.1) {
              map.panBy([offsetX, offsetY], { animate: false });
            }
            lastCenterRef.current = centerRef.current;
          } catch (error) {
            console.warn('MapCenter: panBy failed:', error);
            lastCenterRef.current = centerRef.current;
          }
        }
        rafIdRef.current = null;
      });
    }

    // Reset when simulation stops
    if (!isSimulating) {
      hasInitializedRef.current = false;
      lastCenterRef.current = null;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
    
    // Cleanup
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isSimulating, map]); // Removed center from dependencies - use ref instead to prevent excessive updates

  return null;
};

export default MapCenter;
