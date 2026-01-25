/**
 * Map Component - Leaflet map for web, centered on Sudan
 * Uses HTML/CSS directly on web, React Native on mobile
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// For web, we need to handle div elements differently
const WebDiv = Platform.OS === 'web' ? 'div' : View;

// Web-only: Use Leaflet for mapping
let L = null;
let MapContainer = null;
let TileLayer = null;
let Marker = null;
let Popup = null;
let MapBounds = null;

if (Platform.OS === 'web') {
  // Dynamically import Leaflet only on web
  try {
    L = require('leaflet');
    const reactLeaflet = require('react-leaflet');
    MapContainer = reactLeaflet.MapContainer;
    TileLayer = reactLeaflet.TileLayer;
    Marker = reactLeaflet.Marker;
    Popup = reactLeaflet.Popup;
    MapBounds = require('./MapBounds').default;

    // Fix Leaflet default icon issue
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

/**
 * Get marker color based on facility type
 */
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
    default:
      return '#666666'; // Gray
  }
};

/**
 * Get marker icon based on facility type and status
 */
const createCustomIcon = (type, status, points) => {
  if (!L) return null;

  const color = getMarkerColor(type);
  const size = Math.min(30 + (points / 10), 40); // Size based on priority points

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size * 0.4}px;
      ">
        ${type.charAt(0).toUpperCase()}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

/**
 * Map Component
 * Uses HTML/CSS directly on web, React Native on mobile
 */
const MapComponent = ({ center, zoom, facilities, onFacilityClick }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Load Leaflet CSS on web
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
    }
  }, []);

  // Web implementation using Leaflet with direct HTML/CSS
  if (Platform.OS === 'web') {
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
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            minZoom={5}
            maxZoom={12}
          >
            {MapBounds && <MapBounds />}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={12}
            />
            {facilities.map((facility) => (
              <Marker
                key={facility.id}
                position={[facility.location_lat, facility.location_lng]}
                icon={createCustomIcon(facility.type, facility.status, facility.intervention_points || 0)}
                eventHandlers={{
                  click: () => {
                    onFacilityClick(facility);
                  },
                }}
              >
                <Popup>
                  <div style={{ padding: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>
                      {facility.name}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}
                      <br />
                      {(facility.intervention_points || 0).toFixed(1)} pts
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </MapDiv>
      </View>
    );
  }

  // Fallback - always show something visible
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

export default MapComponent;
