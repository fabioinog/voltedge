/**
 * Map Component - Leaflet map for web, centered on Sudan
 * Uses HTML/CSS directly on web, React Native on mobile
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Web-only: Use Leaflet for mapping
let L = null;
let MapContainer = null;
let TileLayer = null;
let Marker = null;
let Popup = null;

if (Platform.OS === 'web') {
  // Dynamically import Leaflet only on web
  try {
    L = require('leaflet');
    const reactLeaflet = require('react-leaflet');
    MapContainer = reactLeaflet.MapContainer;
    TileLayer = reactLeaflet.TileLayer;
    Marker = reactLeaflet.Marker;
    Popup = reactLeaflet.Popup;

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
            <Text style={styles.placeholderText}>Leaflet Not Loaded</Text>
            <Text style={styles.placeholderSubtext}>
              MapContainer: {MapContainer ? '✓' : '✗'} | Leaflet: {L ? '✓' : '✗'}
            </Text>
            <Text style={styles.placeholderSubtext}>
              Install: npm install leaflet react-leaflet
            </Text>
            <Text style={styles.placeholderSubtext}>
              Facilities loaded: {facilities.length}
            </Text>
          </View>
        </View>
      );
    }

      // Use dangerouslySetInnerHTML approach for web
    // React Native Web can render div, but we need to ensure it's in the DOM
    const mapId = 'voltedge-map-container';
    
    return (
      <View style={styles.container}>
        <View
          nativeID={mapId}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {/* Render map using React Leaflet - React Native Web should handle this */}
          {typeof window !== 'undefined' && (
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              whenCreated={(mapInstance) => {
                // Store map instance for later use
                console.log('Map created:', mapInstance);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
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
                        Type: {facility.type}
                        <br />
                        Points: {(facility.intervention_points || 0).toFixed(1)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </View>
      </View>
    );
  }

  // Fallback for non-web platforms or if Leaflet fails to load
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          {Platform.OS === 'web' ? 'Loading map...' : 'Map view available on web platform'}
        </Text>
        <Text style={styles.placeholderSubtext}>
          {facilities.length} facilities loaded
        </Text>
        {Platform.OS === 'web' && (
          <Text style={styles.placeholderHint}>
            If map doesn't load, check browser console for errors
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
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 20,
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
