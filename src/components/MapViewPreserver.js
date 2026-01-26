/**
 * Map View Preserver Component
 * Prevents the map from resetting zoom/center when popups open or component re-renders
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const MapViewPreserver = () => {
  const map = useMap();
  const savedViewRef = useRef(null);
  const isPreservingRef = useRef(false);
  const mapReadyRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    // Wait for map to be fully ready
    const checkMapReady = () => {
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        if (center && typeof zoom === 'number' && !isNaN(zoom)) {
          mapReadyRef.current = true;
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    };

    // Check if map is ready, retry if not
    const initMapReady = () => {
      if (!checkMapReady()) {
        setTimeout(initMapReady, 50);
      }
    };
    initMapReady();

    // Save current view periodically (when user zooms/pans)
    const saveView = () => {
      if (!mapReadyRef.current) return;
      
      try {
        if (!isPreservingRef.current) {
          const center = map.getCenter();
          const zoom = map.getZoom();
          if (center && typeof zoom === 'number' && !isNaN(zoom)) {
            savedViewRef.current = {
              center: center,
              zoom: zoom,
            };
          }
        }
      } catch (e) {
        // Map not ready yet, ignore
      }
    };

    // Save view on zoom/pan
    map.on('zoomend', saveView);
    map.on('moveend', saveView);

    // Prevent popup from changing view - more aggressive approach
    const handlePopupOpen = (e) => {
      if (!mapReadyRef.current) {
        // Try to save current view first
        try {
          const center = map.getCenter();
          const zoom = map.getZoom();
          if (center && typeof zoom === 'number' && !isNaN(zoom)) {
            savedViewRef.current = {
              center: center,
              zoom: zoom,
            };
            mapReadyRef.current = true;
          }
        } catch (e) {
          // Map not ready yet
          return;
        }
      }
      
      // Save view right before popup opens
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        if (center && typeof zoom === 'number' && !isNaN(zoom)) {
          savedViewRef.current = {
            center: center,
            zoom: zoom,
          };
        }
      } catch (e) {
        // Can't save, skip
        return;
      }

      if (savedViewRef.current) {
        isPreservingRef.current = true;
        const saved = savedViewRef.current;
        
        // Restore view if popup tries to change it - very aggressive
        const restoreView = () => {
          if (!mapReadyRef.current) return;
          
          try {
            const currentZoom = map.getZoom();
            const currentCenter = map.getCenter();
            
            if (currentCenter && typeof currentZoom === 'number' && !isNaN(currentZoom)) {
              if (currentZoom !== saved.zoom || 
                  Math.abs(currentCenter.lat - saved.center.lat) > 0.0001 ||
                  Math.abs(currentCenter.lng - saved.center.lng) > 0.0001) {
                map.setView(saved.center, saved.zoom, { animate: false });
              }
            }
          } catch (e) {
            // Map not ready, ignore
          }
        };
        
        // Restore immediately and multiple times to catch all changes
        restoreView();
        setTimeout(restoreView, 0);
        setTimeout(restoreView, 5);
        setTimeout(restoreView, 10);
        setTimeout(restoreView, 20);
        setTimeout(restoreView, 50);
        setTimeout(restoreView, 100);
        setTimeout(() => {
          restoreView();
          isPreservingRef.current = false;
        }, 200);
      }
    };

    map.on('popupopen', handlePopupOpen);

    // Initial save after a delay to ensure map is ready
    setTimeout(() => {
      if (mapReadyRef.current) {
        saveView();
      }
    }, 100);

    return () => {
      map.off('zoomend', saveView);
      map.off('moveend', saveView);
      map.off('popupopen', handlePopupOpen);
    };
  }, [map]);

  return null;
};

export default MapViewPreserver;
