/**
 * Map Initializer Component
 * Sets initial map view only once, then prevents React-Leaflet from updating it
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const MapInitializer = ({ initialCenter, initialZoom }) => {
  const map = useMap();
  const hasInitializedRef = useRef(false);
  const savedViewRef = useRef(null);

  useEffect(() => {
    // Only set initial view once
    if (!hasInitializedRef.current && initialCenter && initialZoom) {
      map.setView(initialCenter, initialZoom, { animate: false });
      savedViewRef.current = {
        center: map.getCenter(),
        zoom: map.getZoom()
      };
      hasInitializedRef.current = true;
      
      // Prevent React-Leaflet from updating the view
      // Override the internal update method if it exists
      if (map._onResize) {
        const originalOnResize = map._onResize;
        map._onResize = function() {
          // Don't let resize events change the view
          return;
        };
      }
    }
    
    // Continuously preserve the view - prevent any automatic resets
    const preserveView = () => {
      if (hasInitializedRef.current && savedViewRef.current) {
        const currentZoom = map.getZoom();
        const currentCenter = map.getCenter();
        
        // Only restore if view was changed unexpectedly (not by user)
        // We check if it's close to initial view, which means it was reset
        const isCloseToInitial = 
          Math.abs(currentZoom - initialZoom) < 0.1 &&
          Math.abs(currentCenter.lat - initialCenter[0]) < 0.01 &&
          Math.abs(currentCenter.lng - initialCenter[1]) < 0.01;
        
        // If it was reset to initial, restore saved view
        if (isCloseToInitial && 
            (currentZoom !== savedViewRef.current.zoom ||
             Math.abs(currentCenter.lat - savedViewRef.current.center.lat) > 0.0001 ||
             Math.abs(currentCenter.lng - savedViewRef.current.center.lng) > 0.0001)) {
          map.setView(savedViewRef.current.center, savedViewRef.current.zoom, { animate: false });
        } else {
          // Update saved view if user changed it
          savedViewRef.current = {
            center: currentCenter,
            zoom: currentZoom
          };
        }
      }
    };
    
    // Check periodically
    const interval = setInterval(preserveView, 100);
    
    // Also update saved view on user interactions
    map.on('zoomend', () => {
      if (hasInitializedRef.current) {
        savedViewRef.current = {
          center: map.getCenter(),
          zoom: map.getZoom()
        };
      }
    });
    
    map.on('moveend', () => {
      if (hasInitializedRef.current) {
        savedViewRef.current = {
          center: map.getCenter(),
          zoom: map.getZoom()
        };
      }
    });
    
    return () => {
      clearInterval(interval);
      map.off('zoomend');
      map.off('moveend');
    };
  }, [map, initialCenter, initialZoom]);

  return null;
};

export default MapInitializer;
