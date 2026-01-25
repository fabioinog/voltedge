# Map Setup Instructions

## Installation

The map feature uses **Leaflet** for web mapping. Install dependencies:

```bash
npm install leaflet react-leaflet --legacy-peer-deps
```

## Offline Map Support

### Option 1: Use Online Tiles (Default)
The current implementation uses OpenStreetMap tiles online. This works when connected to the internet.

### Option 2: Offline Tiles (For True Offline Support)

To enable offline map tiles:

1. **Download map tiles for Sudan region:**
   - Use tools like [Mobile Atlas Creator](https://mobac.sourceforge.io/) or [TileMill](https://tilemill-project.github.io/tilemill/)
   - Download tiles for zoom levels 5-12 covering Sudan
   - Save tiles in `assets/map-tiles/` directory

2. **Update MapComponent.js:**
   Replace the TileLayer with:
   ```javascript
   <TileLayer
     url="/assets/map-tiles/{z}/{x}/{y}.png"
     maxZoom={12}
   />
   ```

3. **Serve tiles statically:**
   - For Expo web, tiles will be served from the assets folder
   - Ensure tiles are included in the build

## Map Features

- **Centered on Sudan**: Default view shows entire country
- **Scrollable/Zoomable**: Users can pan and zoom like normal maps
- **Facility Markers**: Color-coded by type:
  - Blue: Water sources
  - Orange: Power sources
  - Red: Emergency shelters
  - Green: Food sources
- **Clickable Markers**: Click to see facility details and report problems
- **Priority-based Size**: Marker size reflects intervention priority points

## Public API Integration

The app is set up to integrate with free APIs for Sudan data:

### Recommended APIs:
1. **OpenStreetMap Overpass API** - For infrastructure data
   - Free, no API key required
   - Query: `https://overpass-api.de/api/interpreter`

2. **Humanitarian Data Exchange (HDX)** - For emergency data
   - Free, requires registration
   - URL: `https://data.humdata.org/`

3. **UN OCHA** - For humanitarian facilities
   - Free, public data
   - Various endpoints available

### Implementation:
Update `src/utils/dataSync.js` with actual API calls to these services.

## Testing

1. Run the app: `npx expo start --web`
2. Navigate to Map screen
3. You should see:
   - Map centered on Sudan
   - Sample facilities (4 facilities for testing)
   - Clickable markers
   - Priority list button

## Troubleshooting

### Map not showing:
- Ensure Leaflet CSS is loaded (check browser console)
- Check that `react-leaflet` is installed
- Verify web platform is being used

### Markers not appearing:
- Check database has facilities with valid coordinates
- Verify `location_lat` and `location_lng` are set
- Check browser console for errors

### Offline not working:
- Online tiles require internet connection
- For true offline, follow "Offline Tiles" instructions above
