import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const WebDiv = Platform.OS === 'web' ? 'div' : View;

let L = null;
let MapContainer = null;
let TileLayer = null;
let Marker = null;
let Popup = null;
let MapBounds = null;
let MapCenter = null;
let MapInitializer = null;
let MapViewPreserver = null;

if (Platform.OS === 'web') {
  try {
    L = require('leaflet');
    const reactLeaflet = require('react-leaflet');
    MapContainer = reactLeaflet.MapContainer;
    TileLayer = reactLeaflet.TileLayer;
    Marker = reactLeaflet.Marker;
    Popup = reactLeaflet.Popup;
    MapBounds = require('./map_bounds').default;
    MapCenter = require('./map_center').default;
    MapInitializer = require('./map_initializer').default;
    MapViewPreserver = require('./map_view_preserver').default;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  } catch (error) {
    console.warn('Leaflet not available:', error);
  }
}


const getMarkerColor = (type) => {
  switch (type) {
    case 'water':
      return '#0066cc'; // Blue
    case 'power':
      return '#ff9900'; // Orange
    case 'shelter':
      return '#cc0000'; // Red
    case 'food':
      return '#00cc00'; // Green
    case 'hospital':
      return '#cc00cc'; // Magenta/Purple
    default:
      return '#666666'; // Gray
  }
};

/**
 * Build Leaflet map HTML for WebView (Android/iOS). Injects map data and uses postMessage for marker clicks.
 */
const buildLeafletMapHtml = (center, zoom, facilities, userLocation) => {
  const data = {
    center: center || [15.5, 30],
    zoom: zoom || 6,
    facilities: (facilities || []).map((f) => ({
      id: f.id,
      name: f.name,
      lat: f.location_lat,
      lng: f.location_lng,
      type: f.type,
      status: f.status,
    })),
    userLocation: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
  };
  const dataStr = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>body{margin:0;padding:0;} #map{width:100%;height:100vh;}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var __MAP_DATA__ = ${dataStr};
    var data = typeof __MAP_DATA__ === 'string' ? JSON.parse(__MAP_DATA__) : __MAP_DATA__;
    var map = L.map('map').setView(data.center, data.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    function getColor(t) { var c = { water: '#0066cc', power: '#ff9900', shelter: '#cc0000', food: '#00cc00', hospital: '#cc00cc' }; return c[t] || '#666666'; }
    data.facilities.forEach(function(f) {
      var isFailed = f.status === 'failed';
      var color = isFailed ? '#cc0000' : getColor(f.type);
      var marker = L.circleMarker([f.lat, f.lng], { radius: 10, fillColor: color, color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map);
      marker.facilityId = f.id;
      marker.on('click', function() {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'facilityClick', facilityId: f.id }));
      });
    });
    if (data.userLocation) {
      L.circleMarker([data.userLocation.lat, data.userLocation.lng], { radius: 8, fillColor: '#00ff00', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map).bindPopup('Your location');
    }
  </script>
</body>
</html>`;
};


const getFacilityIcon = (type) => {
  const icons = {
    water: '💧',    // Water droplet
    power: '⚡',    // Lightning bolt
    shelter: '🏠',  // House
    food: '🍞',     // Bread
    hospital: '🏥', 
  };
  return icons[type] || '📍'; 
};


const createCustomIcon = (type, status, points, isFailed = false, facilityName = '') => {
  if (!L) return null;

  const color = isFailed || status === 'failed' ? '#cc0000' : getMarkerColor(type);
  const size = Math.min(30 + (points / 10), 40);
  const icon = getFacilityIcon(type);
  
  const warningIndicator = isFailed || status === 'failed' ? '⚠️' : '';

  const failedGlow = isFailed || status === 'failed' 
    ? '0 0 15px rgba(255,0,0,1), 0 0 25px rgba(255,0,0,0.8), 0 0 35px rgba(255,0,0,0.6)' 
    : '0 2px 4px rgba(0,0,0,0.3)';
  
  const markerClass = isFailed || status === 'failed' ? 'custom-marker-failed' : 'custom-marker';
  const inlineStyle = isFailed || status === 'failed' 
    ? `background-color: ${color} !important;
       width: ${size}px !important;
       height: ${size}px !important;
       border-radius: 50% !important;
       border: 4px solid #ff0000 !important;
       box-shadow: 0 0 25px rgba(255,0,0,1), 0 0 50px rgba(255,0,0,0.9), 0 0 75px rgba(255,0,0,0.7), 0 0 100px rgba(255,0,0,0.5) !important;
       display: flex !important;
       align-items: center !important;
       justify-content: center !important;
       color: white !important;
       font-weight: bold !important;
       font-size: ${size * 0.5}px !important;
       line-height: 1 !important;
       position: relative !important;
       z-index: 1000 !important;
       animation: failedPulse 1.5s ease-in-out infinite !important;`
    : `background-color: ${color};
       width: ${size}px;
       height: ${size}px;
       border-radius: 50%;
       border: 3px solid white;
       box-shadow: ${failedGlow};
       display: flex;
       align-items: center;
       justify-content: center;
       color: white;
       font-weight: bold;
       font-size: ${size * 0.5}px;
       line-height: 1;
       position: relative;
       z-index: 100;`;
  
  return L.divIcon({
    className: markerClass,
    html: `
      <div class="${markerClass}-inner" style="${inlineStyle}" title="${facilityName || 'Facility'}">
        ${icon}
        ${warningIndicator ? `<div style="position: absolute; top: -8px; right: -8px; font-size: 16px; z-index: 1001;">${warningIndicator}</div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Connections
const RoutePolylineComponent = ({ route }) => {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  
  React.useEffect(() => {
    if (route.waypoints && route.waypoints.length > 1 && L) {
      const latlngs = route.waypoints.map(wp => [wp.lat, wp.lng]);
      const polyline = L.polyline(latlngs, { 
        color: '#0066cc', 
        weight: 4, 
        opacity: 0.7,
        smoothFactor: 1
      });
      polyline.addTo(map);
      
      return () => {
        map.removeLayer(polyline);
      };
    }
  }, [route, map]);
  
  return null;
};

/**
 * Map Component
 * Uses HTML/CSS directly on web, React Native on mobile
 */
const MapComponent = ({ center, zoom, facilities, userLocation, route, onFacilityClick, isSimulating, connections, topPriorityFacilities }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const isInitializedRef = useRef(false);
  // Store initial values only once - never update them after first render
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  const mapCreatedRef = useRef(false);
  const shouldUpdateMapRef = useRef(false);
  const mapKeyRef = useRef(`map-${Date.now()}`);
  // Store the actual current view to prevent resets
  const currentViewRef = useRef(null);
  
  // Memoize facilities to prevent unnecessary re-renders
  const memoizedFacilities = useMemo(() => facilities, [facilities]);
  
  // Memoize connections to prevent unnecessary re-renders
  const memoizedConnections = useMemo(() => connections, [connections]);
  
  // Memoize topPriorityFacilities to prevent unnecessary re-renders
  const memoizedTopPriorityFacilities = useMemo(() => topPriorityFacilities, [topPriorityFacilities]);
  
  // Memoize onFacilityClick to prevent marker re-renders
  const memoizedOnFacilityClick = useCallback((facility) => {
    onFacilityClick(facility);
  }, [onFacilityClick]);

  // Native map region (used only when Platform.OS !== 'web' with react-native-maps - kept for compatibility)
  const nativeRegion = useMemo(() => ({
    latitude: center?.[0] ?? 15.5,
    longitude: center?.[1] ?? 30.0,
    latitudeDelta: zoom ? Math.max(0.5, 12 - zoom) : 6,
    longitudeDelta: zoom ? Math.max(0.5, 12 - zoom) : 6,
  }), [center, zoom]);

  // Leaflet HTML for native WebView (Android/iOS) - built at top level for hooks rules
  const leafletMapHtml = useMemo(
    () => (Platform.OS === 'web' ? '' : buildLeafletMapHtml(center, zoom, memoizedFacilities, userLocation)),
    [center, zoom, memoizedFacilities, userLocation]
  );

  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'facilityClick' && msg.facilityId != null) {
          const facility = memoizedFacilities.find((f) => f.id === msg.facilityId);
          if (facility) memoizedOnFacilityClick(facility);
        }
      } catch (e) {
        // ignore
      }
    },
    [memoizedFacilities, memoizedOnFacilityClick]
  );

  // Load Leaflet CSS and add custom styles for failed facilities on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Check if Leaflet CSS is already loaded
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      
      // Add custom CSS for failed facility glow and animation
      if (!document.querySelector('#failed-facility-styles')) {
        const style = document.createElement('style');
        style.id = 'failed-facility-styles';
        style.textContent = `
          .custom-marker-failed .custom-marker-failed-inner,
          .leaflet-div-icon.custom-marker-failed .custom-marker-failed-inner,
          .leaflet-div-icon.custom-marker-failed > div {
            animation: failedPulse 1.5s ease-in-out infinite !important;
            box-shadow: 0 0 25px rgba(255,0,0,1), 0 0 50px rgba(255,0,0,0.9), 0 0 75px rgba(255,0,0,0.7), 0 0 100px rgba(255,0,0,0.5) !important;
          }
          @keyframes failedPulse {
            0%, 100% {
              box-shadow: 0 0 25px rgba(255,0,0,1), 0 0 50px rgba(255,0,0,0.9), 0 0 75px rgba(255,0,0,0.7), 0 0 100px rgba(255,0,0,0.5) !important;
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 35px rgba(255,0,0,1), 0 0 70px rgba(255,0,0,1), 0 0 105px rgba(255,0,0,0.9), 0 0 140px rgba(255,0,0,0.7) !important;
              transform: scale(1.15);
            }
          }
        `;
        document.head.appendChild(style);
        console.log('MapComponent: Added failed facility glow CSS styles');
      }
    }
  }, []);

  // Web implementation using Leaflet with direct HTML/CSS
  if (Platform.OS === 'web') {
    const FacilityConnections = require('./facility_connections').default;
    // Check if Leaflet is loaded
    if (!MapContainer || !L) {
      return (
        <View style={styles.container}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Sudan Map</Text>
            <Text style={styles.placeholderSubtext}>
              {facilities.length} facilities loaded
            </Text>
            <Text style={styles.placeholderSubtext}>
              Install map: npm install leaflet react-leaflet --legacy-peer-deps
            </Text>
            <Text style={styles.placeholderSubtext}>
              Then refresh the page
            </Text>
          </View>
        </View>
      );
    }

    // React Native Web supports HTML elements - use createElement for div
    const MapDiv = ({ children, style }) => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        return React.createElement('div', { style }, children);
      }
      return <View style={style}>{children}</View>;
    };

    return (
      <View style={styles.container}>
        <MapDiv style={{ width: '100%', height: '100%', position: 'relative' }}>
          <MapContainer
            key={mapKeyRef.current}
            center={initialCenterRef.current}
            zoom={initialZoomRef.current}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            minZoom={5}
            maxZoom={19}
            zoomControl={true}
            preferCanvas={false}
            whenCreated={(map) => {
              mapInstanceRef.current = map;
              isInitializedRef.current = true;
              mapCreatedRef.current = true;
              
              // Store the current view immediately
              currentViewRef.current = {
                center: map.getCenter(),
                zoom: map.getZoom()
              };
              
              // CRITICAL: Prevent React-Leaflet from syncing center/zoom props to map view
              // Monitor continuously to catch and prevent any view resets
              const preventPropSync = () => {
                if (currentViewRef.current) {
                  try {
                    const saved = currentViewRef.current;
                    const currentZoom = map.getZoom();
                    const currentCenter = map.getCenter();
                    
                    // If view was changed by React-Leaflet (reset to initial), restore it
                    const isResetToInitial = 
                      Math.abs(currentZoom - initialZoomRef.current) < 0.1 &&
                      Math.abs(currentCenter.lat - initialCenterRef.current[0]) < 0.01 &&
                      Math.abs(currentCenter.lng - initialCenterRef.current[1]) < 0.01;
                    
                    if (isResetToInitial && 
                        (currentZoom !== saved.zoom ||
                         Math.abs(currentCenter.lat - saved.center.lat) > 0.0001 ||
                         Math.abs(currentCenter.lng - saved.center.lng) > 0.0001)) {
                      // Immediately restore - this happens when React-Leaflet syncs props
                      map.setView(saved.center, saved.zoom, { animate: false });
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                }
              };
              
              // Monitor VERY frequently to catch React-Leaflet prop syncs
              const interval = setInterval(preventPropSync, 10);
              
              // Update saved view on user interactions (zoom/pan)
              map.on('zoomend', () => {
                currentViewRef.current = {
                  center: map.getCenter(),
                  zoom: map.getZoom()
                };
              });
              
              map.on('moveend', () => {
                currentViewRef.current = {
                  center: map.getCenter(),
                  zoom: map.getZoom()
                };
              });
              
              // Catch viewreset events (happens when React-Leaflet resets)
              map.on('viewreset', () => {
                if (currentViewRef.current) {
                  map.setView(currentViewRef.current.center, currentViewRef.current.zoom, { animate: false });
                }
              });
              
              // Override invalidateSize to prevent view changes and errors
              const originalInvalidateSize = map.invalidateSize.bind(map);
              map.invalidateSize = function(options) {
                try {
                  const savedView = {
                    center: map.getCenter(),
                    zoom: map.getZoom()
                  };
                  const result = originalInvalidateSize.call(this, options);
                  // Immediately restore view after invalidateSize
                  requestAnimationFrame(() => {
                    try {
                      if (savedView && currentViewRef.current) {
                        const currentZoom = map.getZoom();
                        const currentCenter = map.getCenter();
                        if (currentZoom !== savedView.zoom ||
                            Math.abs(currentCenter.lat - savedView.center.lat) > 0.0001 ||
                            Math.abs(currentCenter.lng - savedView.center.lng) > 0.0001) {
                          map.setView(savedView.center, savedView.zoom, { animate: false });
                        }
                      }
                    } catch (e) {
                      // Ignore
                    }
                  });
                  return result;
                } catch (e) {
                  // If invalidateSize fails (like the _leaflet_pos error), just return map
                  return this;
                }
              };
              
              // Cleanup
              map.on('remove', () => {
                clearInterval(interval);
              });
              
              // Disable popup autoPan
              if (L && L.Popup && L.Popup.prototype) {
                L.Popup.prototype._adjustPan = function() {
                  return;
                };
              }
            }}
          >
            {MapInitializer && (
              <MapInitializer 
                initialCenter={initialCenterRef.current} 
                initialZoom={initialZoomRef.current} 
              />
            )}
            {MapBounds && <MapBounds isSimulating={isSimulating} />}
            {MapCenter && userLocation && <MapCenter center={[userLocation.lat, userLocation.lng]} isSimulating={isSimulating} />}
            {MapViewPreserver && <MapViewPreserver />}
            <TileLayer
              key="main-tile-layer"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              updateWhenZooming={false}
              updateWhenIdle={false}
              keepBuffer={5}
              noWrap={false}
            />
            
            {/* User Location Marker - Always show if userLocation exists */}
            {userLocation && L && (
              <Marker
                key="user-location-marker"
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: '<div style="width: 30px; height: 30px; border-radius: 50%; background-color: #00ff00; border: 4px solid white; box-shadow: 0 0 15px rgba(0,255,0,0.8), 0 0 30px rgba(0,255,0,0.4); z-index: 1000;"></div>',
                  iconSize: [30, 30],
                  iconAnchor: [15, 15],
                })}
              >
                <Popup>
                  <div style={{ padding: '8px' }}>
                    <strong>Your Location</strong>
                    <br />
                    Accuracy: {Math.round(userLocation.accuracy || 10)}m
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route Polyline */}
            {route && route.waypoints && route.waypoints.length > 1 && (
              <RoutePolylineComponent route={route} />
            )}

            {/* Facility Connections */}
            {memoizedConnections && Array.isArray(memoizedConnections) && memoizedConnections.length > 0 && (
              <FacilityConnections 
                connections={memoizedConnections} 
                topPriorityFacilities={memoizedTopPriorityFacilities || []}
              />
            )}

            {memoizedFacilities.map((facility) => {
              // Check if facility is failed
              const isFailed = facility.status === 'failed';
              return (
                <Marker
                  key={facility.id}
                  position={[facility.location_lat, facility.location_lng]}
                  icon={createCustomIcon(facility.type, facility.status, facility.intervention_points || 0, isFailed, facility.name)}
                  title={facility.name || 'Facility'}
                  alt={facility.name || 'Facility'}
                  eventHandlers={{
                    click: (e) => {
                      // Completely prevent popup from opening
                      e.originalEvent?.stopPropagation();
                      e.originalEvent?.preventDefault();
                      // Close any open popups first
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.closePopup();
                      }
                      // Call the click handler
                      memoizedOnFacilityClick(facility);
                    },
                  }}
                >
                  {/* Popup is disabled - we handle clicks manually to prevent zoom */}
                </Marker>
              );
            })}
          </MapContainer>
        </MapDiv>
      </View>
    );
  }

  // Native (Android/iOS): WebView with Leaflet so we don't depend on react-native-maps. Web app unchanged above.
  if (Platform.OS !== 'web') {
    try {
      const { WebView } = require('react-native-webview');
      return (
        <View style={styles.container}>
          <WebView
            source={{ html: leafletMapHtml }}
            originWhitelist={['*']}
            style={styles.nativeMap}
            scrollEnabled={true}
            bounces={false}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      );
    } catch (e) {
      console.warn('WebView not available for map:', e);
    }
  }

  // Fallback: placeholder (native when WebView fails, or web without Leaflet)
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Sudan Map
        </Text>
        <Text style={styles.placeholderSubtext}>
          {facilities.length} facilities loaded
        </Text>
        {Platform.OS === 'web' && (
          <Text style={styles.placeholderHint}>
            To see the interactive map, install: npm install leaflet react-leaflet --legacy-peer-deps
          </Text>
        )}
        {Platform.OS === 'android' && (
          <Text style={styles.placeholderHint}>
            Use Priority List and facility cards for navigation.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
    backgroundColor: '#e8f4f8', // Light blue to verify rendering
  },
  nativeMap: {
    width: '100%',
    height: '100%',
    flex: 1,
    minHeight: 400,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
    padding: 20,
    minHeight: 400,
  },
  placeholderText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 8,
  },
  placeholderHint: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

// Memoize the component to prevent unnecessary re-renders
export default React.memo(MapComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.facilities === nextProps.facilities &&
    prevProps.userLocation?.lat === nextProps.userLocation?.lat &&
    prevProps.userLocation?.lng === nextProps.userLocation?.lng &&
    prevProps.isSimulating === nextProps.isSimulating &&
    prevProps.connections === nextProps.connections &&
    prevProps.topPriorityFacilities === nextProps.topPriorityFacilities &&
    prevProps.route === nextProps.route
  );
});
