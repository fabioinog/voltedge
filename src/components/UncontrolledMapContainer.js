/**
 * Uncontrolled Map Container Wrapper
 * Prevents React-Leaflet from syncing center/zoom props to the map view
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const UncontrolledMapContainer = ({ initialCenter, initialZoom }) => {
  const map = useMap();
  const hasInitializedRef = useRef(false);
  const savedViewRef = useRef(null);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (!map || hasInitializedRef.current) return;

    // Set initial view only once
    if (initialCenter && initialZoom) {
      map.setView(initialCenter, initialZoom, { animate: false });
      savedViewRef.current = {
        center: map.getCenter(),
        zoom: map.getZoom()
      };
      hasInitializedRef.current = true;
    }

    // Save view on user interactions
    const saveView = () => {
      if (!isRestoringRef.current) {
        savedViewRef.current = {
          center: map.getCenter(),
          zoom: map.getZoom()
        };
      }
    };

    map.on('zoomend', saveView);
    map.on('moveend', saveView);

    // Prevent view resets - monitor continuously
    const preventReset = () => {
      if (!savedViewRef.current || isRestoringRef.current) return;

      try {
        const currentZoom = map.getZoom();
        const currentCenter = map.getCenter();

        // Check if view was reset to initial
        const isReset = 
          Math.abs(currentZoom - initialZoom) < 0.1 &&
          Math.abs(currentCenter.lat - initialCenter[0]) < 0.01 &&
          Math.abs(currentCenter.lng - initialCenter[1]) < 0.01;

        if (isReset && savedViewRef.current) {
          const saved = savedViewRef.current;
          if (currentZoom !== saved.zoom ||
              Math.abs(currentCenter.lat - saved.center.lat) > 0.0001 ||
              Math.abs(currentCenter.lng - saved.center.lng) > 0.0001) {
            isRestoringRef.current = true;
            map.setView(saved.center, saved.zoom, { animate: false });
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 100);
          }
        }
      } catch (e) {
        // Ignore
      }
    };

    const interval = setInterval(preventReset, 50);

    // Also catch viewreset events
    map.on('viewreset', () => {
      if (savedViewRef.current && !isRestoringRef.current) {
        isRestoringRef.current = true;
        map.setView(savedViewRef.current.center, savedViewRef.current.zoom, { animate: false });
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      }
    });

    return () => {
      clearInterval(interval);
      map.off('zoomend', saveView);
      map.off('moveend', saveView);
      map.off('viewreset');
    };
  }, [map, initialCenter, initialZoom]);

  return null;
};

export default UncontrolledMapContainer;
