import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { FarmRecord, FarmBoundary } from '../../types';
import { TN_DISTRICT_GEODATA } from '../../config/tamilNaduDistricts';
import { useLanguage } from '../../context/LanguageContext';
import {
  Compass,
  MapPin,
  Layers,
  Crosshair,
  Trash2,
  Undo2,
  Check,
  X,
  Maximize2,
  Minimize2,
  Info,
  AlertTriangle,
  Sparkles,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Navigation
} from 'lucide-react';

interface FarmGISMapProps {
  farms?: FarmRecord[];
  selectedFarm?: FarmRecord | null;
  onSelectFarm?: (farm: FarmRecord) => void;
  onSaveBoundary?: (boundary: FarmBoundary, measuredAcres: number, measuredCents: number) => void;
  initialDistrict?: string;
  className?: string;
  readOnly?: boolean;
}

export interface LiveMeasurements {
  areaSqMeters: number;
  hectares: number;
  acres: number;
  cents: number;
  perimeterMeters: number;
  isValid: boolean;
  validationError?: string;
}

export const FarmGISMap: React.FC<FarmGISMapProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onSaveBoundary,
  initialDistrict = 'Thanjavur',
  className = '',
  readOnly = false,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Drawing & Geometry State
  // Coordinates are stored as [lat, lng] for Leaflet rendering
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activeLayerType, setActiveLayerType] = useState<'satellite' | 'streets'>('satellite');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live Measurements
  const [measurements, setMeasurements] = useState<LiveMeasurements>({
    areaSqMeters: 0,
    hectares: 0,
    acres: 0,
    cents: 0,
    perimeterMeters: 0,
    isValid: true,
  });

  // Leaflet Layer References
  const activePolygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const savedFarmsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userGpsMarkerRef = useRef<L.Marker | null>(null);

  // Helper to calculate measurements from Leaflet [lat, lng] array
  const calculateLiveMeasurements = (coords: [number, number][]): LiveMeasurements => {
    if (coords.length < 3) {
      return {
        areaSqMeters: 0,
        hectares: 0,
        acres: 0,
        cents: 0,
        perimeterMeters: 0,
        isValid: true,
      };
    }

    try {
      // GeoJSON requires [longitude, latitude]
      const geoJsonRing: [number, number][] = coords.map(([lat, lng]) => [lng, lat]);
      // Close the ring
      if (
        geoJsonRing[0][0] !== geoJsonRing[geoJsonRing.length - 1][0] ||
        geoJsonRing[0][1] !== geoJsonRing[geoJsonRing.length - 1][1]
      ) {
        geoJsonRing.push(geoJsonRing[0]);
      }

      const poly = turf.polygon([geoJsonRing]);

      // Check self-intersections
      const kinks = turf.kinks(poly);
      const isSelfIntersecting = kinks.features.length > 0;

      const areaSqM = turf.area(poly);
      const line = turf.polygonToLine(poly);
      const perimeterM = line
        ? (Array.isArray(line) ? 0 : turf.length(line, { units: 'kilometers' }) * 1000)
        : 0;

      const hectares = areaSqM / 10000;
      // 1 Acre = 4046.8564224 m²
      const acres = areaSqM / 4046.8564224;
      // In Tamil Nadu revenue system: 1 Acre = 100 Cents
      const cents = acres * 100;

      return {
        areaSqMeters: Math.round(areaSqM * 10) / 10,
        hectares: Math.round(hectares * 1000) / 1000,
        acres: Math.round(acres * 1000) / 1000,
        cents: Math.round(cents * 10) / 10,
        perimeterMeters: Math.round(perimeterM * 10) / 10,
        isValid: !isSelfIntersecting,
        validationError: isSelfIntersecting
          ? isTa
            ? 'எல்லைக் கோடுகள் ஒன்றை ஒன்று குறுக்கறுக்கக் கூடாது (Self-intersecting).'
            : 'Boundary lines self-intersect. Please adjust vertices to form a simple polygon.'
          : undefined,
      };
    } catch (err: any) {
      return {
        areaSqMeters: 0,
        hectares: 0,
        acres: 0,
        cents: 0,
        perimeterMeters: 0,
        isValid: false,
        validationError: err.message || 'Invalid geometry',
      };
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    const targetGeo = TN_DISTRICT_GEODATA[initialDistrict] || TN_DISTRICT_GEODATA.Thanjavur;
    const initialLat = targetGeo.latitude;
    const initialLng = targetGeo.longitude;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19,
    });

    // Custom Top-Right Zoom Control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Metric Scale Bar
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Satellite Imagery Layer (Esri World Imagery)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    );

    satelliteLayer.addTo(map);
    tileLayerRef.current = satelliteLayer;

    // Layer Groups
    vertexMarkersLayerRef.current = L.layerGroup().addTo(map);
    savedFarmsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Layer: Satellite vs Streets
  const handleSwitchLayer = (layerType: 'satellite' | 'streets') => {
    if (!mapInstanceRef.current) return;
    setActiveLayerType(layerType);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (layerType === 'satellite') {
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }
      );
      sat.addTo(mapInstanceRef.current);
      tileLayerRef.current = sat;
    } else {
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      osm.addTo(mapInstanceRef.current);
      tileLayerRef.current = osm;
    }
  };

  // Fly to District when district selection changes
  const handleDistrictChange = (distKey: string) => {
    setSelectedDistrict(distKey);
    const geo = TN_DISTRICT_GEODATA[distKey];
    if (geo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([geo.latitude, geo.longitude], 15, { duration: 1.2 });
    }
  };

  // GPS Locate Current Farmer Location
  const handleGpsLocate = () => {
    if (!navigator.geolocation) {
      setGpsError(isTa ? 'உங்கள் உலாவியில் GPS ஆதரிக்கப்படவில்லை.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude, accuracy } = pos.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.5 });

          // Remove previous GPS marker
          if (userGpsMarkerRef.current) {
            userGpsMarkerRef.current.remove();
          }

          const gpsIcon = L.divIcon({
            className: 'custom-gps-marker',
            html: `
              <div class="relative flex items-center justify-center">
                <span class="absolute w-8 h-8 rounded-full bg-[#00E5FF]/30 animate-ping"></span>
                <span class="relative w-4 h-4 rounded-full bg-[#00E5FF] border-2 border-white shadow-md"></span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([latitude, longitude], { icon: gpsIcon }).addTo(mapInstanceRef.current);
          marker.bindPopup(`
            <div style="font-family: monospace; font-size: 12px; color: #0B241B;">
              <strong>${isTa ? 'தற்போதைய GPS இருப்பிடம்' : 'Current GPS Position'}</strong><br/>
              Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}<br/>
              <span style="color: #64766B;">Accuracy: ±${Math.round(accuracy)}m</span>
            </div>
          `);
          userGpsMarkerRef.current = marker;
        }
      },
      (err) => {
        setGpsLoading(false);
        let msg = 'Failed to obtain GPS location.';
        if (err.code === 1) msg = isTa ? 'GPS அனுமதி மறுக்கப்பட்டது.' : 'Location permission denied by user.';
        else if (err.code === 2) msg = isTa ? 'இருப்பிடத்தை கண்டறிய முடியவில்லை.' : 'Position unavailable.';
        else if (err.code === 3) msg = isTa ? 'இருப்பிட நேரம் முடிவடைந்தது.' : 'Location request timed out.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Location / Coordinates Query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    // Check if user entered coordinates "lat, lng"
    const coordParts = searchQuery.split(',').map((s) => parseFloat(s.trim()));
    if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
      const [lat, lng] = coordParts;
      if (lat >= 8 && lat <= 14 && lng >= 76 && lng <= 81) {
        mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
        return;
      }
    }

    // Check if matches known district
    const matchedDist = Object.keys(TN_DISTRICT_GEODATA).find((k) =>
      k.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchedDist) {
      handleDistrictChange(matchedDist);
    }
  };

  // Draw Mode Click Handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;
      const { lat, lng } = e.latlng;
      setPolygonCoords((prev) => [...prev, [lat, lng]]);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawing]);

  // Update Active Polygon & Vertex Markers when polygonCoords changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Calculate live measurements
    const liveMetrics = calculateLiveMeasurements(polygonCoords);
    setMeasurements(liveMetrics);

    // Clear previous active polygon layer
    if (activePolygonLayerRef.current) {
      activePolygonLayerRef.current.remove();
      activePolygonLayerRef.current = null;
    }

    // Clear previous vertex markers
    if (vertexMarkersLayerRef.current) {
      vertexMarkersLayerRef.current.clearLayers();
    }

    if (polygonCoords.length === 0) return;

    // Draw Polygon Overlay (Translucent Cyan with Lime Accent)
    const polygon = L.polygon(polygonCoords, {
      color: liveMetrics.isValid ? '#00E5FF' : '#B8423A',
      weight: 3,
      opacity: 0.95,
      fillColor: liveMetrics.isValid ? '#00E5FF' : '#B8423A',
      fillOpacity: 0.22,
      dashArray: isDrawing ? '6 6' : undefined,
    });

    polygon.addTo(map);
    activePolygonLayerRef.current = polygon;

    // Render Draggable Vertex Markers (unless read-only)
    if (!readOnly && vertexMarkersLayerRef.current) {
      polygonCoords.forEach((pt, index) => {
        const isFirst = index === 0;
        const vertexIcon = L.divIcon({
          className: 'custom-vertex-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-move group">
              <div class="w-6 h-6 rounded-full ${
                isFirst && isDrawing ? 'bg-[#70B77E] ring-2 ring-white' : 'bg-[#00E5FF] border-2 border-[#0B241B]'
              } text-[#0B241B] flex items-center justify-center text-[10px] font-mono font-bold shadow-md hover:scale-125 transition-transform">
                ${index + 1}
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(pt, {
          icon: vertexIcon,
          draggable: !isDrawing, // Drag to adjust vertices once finished drawing
        });

        // Click first marker while drawing to close polygon
        if (isDrawing && isFirst && polygonCoords.length >= 3) {
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setIsDrawing(false);
          });
        }

        // Live drag update for vertices
        marker.on('drag', (e: any) => {
          const newPos = e.target.getLatLng();
          setPolygonCoords((prev) => {
            const next = [...prev];
            next[index] = [newPos.lat, newPos.lng];
            return next;
          });
        });

        vertexMarkersLayerRef.current?.addLayer(marker);
      });
    }
  }, [polygonCoords, isDrawing, readOnly]);

  // Load Selected Farm's boundary if supplied
  useEffect(() => {
    if (selectedFarm && selectedFarm.boundary?.coordinates && selectedFarm.boundary.coordinates.length > 0) {
      try {
        const ring = selectedFarm.boundary.coordinates[0];
        // Convert GeoJSON [lng, lat] back to Leaflet [lat, lng]
        const leafletCoords: [number, number][] = ring
          .slice(0, ring.length - 1) // omit duplicate closing point
          .map(([lng, lat]) => [lat, lng]);

        setPolygonCoords(leafletCoords);
        setIsDrawing(false);

        // Zoom to the loaded polygon
        if (mapInstanceRef.current && leafletCoords.length >= 3) {
          const poly = L.polygon(leafletCoords);
          mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [40, 40], maxZoom: 18 });
        }
      } catch (err) {
        console.warn('Failed to parse selected farm boundary:', err);
      }
    }
  }, [selectedFarm]);

  // Render All Saved Farms as Cadastral Overlays on Satellite Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !savedFarmsLayerGroupRef.current) return;

    savedFarmsLayerGroupRef.current.clearLayers();

    farms.forEach((farm) => {
      if (farm.id === selectedFarm?.id) return; // Active selected farm is rendered separately
      if (farm.boundary?.coordinates && farm.boundary.coordinates.length > 0) {
        try {
          const ring = farm.boundary.coordinates[0];
          const coords: [number, number][] = ring.map(([lng, lat]) => [lat, lng]);

          const savedPoly = L.polygon(coords, {
            color: farm.isPrimary ? '#70B77E' : '#DFE6DB',
            weight: 2,
            opacity: 0.8,
            fillColor: farm.isPrimary ? '#70B77E' : '#B8DCC1',
            fillOpacity: 0.15,
          });

          savedPoly.bindTooltip(`
            <div style="font-family: Plus Jakarta Sans, sans-serif; font-size: 12px; color: #0B241B;">
              <strong>${farm.farmName}</strong> (${farm.cropType})<br/>
              <span style="font-family: monospace; color: #217451;">${farm.landSizeArea || farm.landSizeAcres || '—'} ${farm.areaUnit || 'Acres'}</span>
            </div>
          `);

          savedPoly.on('click', () => {
            onSelectFarm?.(farm);
          });

          savedFarmsLayerGroupRef.current?.addLayer(savedPoly);
        } catch {}
      }
    });
  }, [farms, selectedFarm]);

  // Start Drawing Mode
  const handleStartDrawing = () => {
    setPolygonCoords([]);
    setIsDrawing(true);
  };

  // Undo Last Point
  const handleUndoPoint = () => {
    setPolygonCoords((prev) => prev.slice(0, -1));
  };

  // Complete Drawing
  const handleFinishDrawing = () => {
    if (polygonCoords.length < 3) return;
    setIsDrawing(false);
  };

  // Clear Boundary
  const handleClearBoundary = () => {
    setPolygonCoords([]);
    setIsDrawing(false);
  };

  // Commit / Save Boundary
  const handleCommitBoundary = () => {
    if (polygonCoords.length < 3 || !measurements.isValid) return;

    // Convert to GeoJSON [lng, lat] ring
    const geoJsonRing: [number, number][] = polygonCoords.map(([lat, lng]) => [lng, lat]);
    geoJsonRing.push(geoJsonRing[0]); // Ensure closed ring

    // Calculate centroid
    const poly = turf.polygon([geoJsonRing]);
    const centroidFeature = turf.centroid(poly);
    const [cLng, cLat] = centroidFeature.geometry.coordinates;

    const boundaryData: FarmBoundary = {
      type: 'Polygon',
      coordinates: [geoJsonRing],
      centroid: [cLat, cLng],
      measuredAreaSqMeters: measurements.areaSqMeters,
      measuredPerimeterMeters: measurements.perimeterMeters,
      measuredAcres: measurements.acres,
      measuredCents: measurements.cents,
      measuredHectares: measurements.hectares,
      surveyStatus: 'farmer_mapped',
      mappedAt: new Date().toISOString(),
    };

    onSaveBoundary?.(boundaryData, measurements.acres, measurements.cents);
  };

  return (
    <div
      className={`relative bg-[#0B241B] text-[#F5F4EA] rounded-[16px] overflow-hidden border border-[#217451]/30 shadow-md flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : className
      }`}
    >
      {/* ========================================================
          1. GIS WORKSPACE TOP TOOLBAR
          ======================================================== */}
      <div className="bg-[#0B241B] border-b border-white/10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#217451] flex items-center justify-center text-white shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-[#70B77E] font-bold flex items-center gap-1.5">
              <span>SATELLITE CADASTRAL MAPPER</span>
              <span>·</span>
              <span className="text-white/60">ESRI WORLD IMAGERY</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Plus_Jakarta_Sans']">
              {isTa ? 'செயற்கைக்கோள் பண்ணை வரைபடம் & பரப்பளவு கணக்கீடு' : 'Interactive Cadastre & Live Area Measurement'}
            </h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* District Quick Fly-to */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-[#081813] border border-white/15 text-xs font-mono text-[#F5F4EA] px-2.5 py-1.5 rounded-[8px] cursor-pointer focus:border-[#70B77E] min-h-[36px]"
              aria-label="Select Tamil Nadu District"
            >
              {Object.keys(TN_DISTRICT_GEODATA).map((dist) => (
                <option key={dist} value={dist}>
                  {dist} ({TN_DISTRICT_GEODATA[dist].nameTamil})
                </option>
              ))}
            </select>
          </div>

          {/* Layer Selector: Satellite vs Streets */}
          <div
            className="flex items-center bg-[#081813] border border-white/15 rounded-[8px] p-0.5 text-xs font-mono"
            role="group"
            aria-label="Map Layer Toggle"
          >
            <button
              onClick={() => handleSwitchLayer('satellite')}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeLayerType === 'satellite'
                  ? 'bg-[#217451] text-white font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
              aria-pressed={activeLayerType === 'satellite'}
            >
              Satellite
            </button>
            <button
              onClick={() => handleSwitchLayer('streets')}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeLayerType === 'streets'
                  ? 'bg-[#217451] text-white font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
              aria-pressed={activeLayerType === 'streets'}
            >
              Streets
            </button>
          </div>

          {/* GPS Locate Me Button */}
          <button
            onClick={handleGpsLocate}
            disabled={gpsLoading}
            className="px-3 py-1.5 bg-[#081813] border border-white/15 hover:border-[#70B77E] text-xs font-mono text-[#F5F4EA] rounded-[8px] flex items-center gap-1.5 cursor-pointer min-h-[36px] transition-colors"
            title="Locate with device GPS"
          >
            <Crosshair className={`w-3.5 h-3.5 text-[#00E5FF] ${gpsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isTa ? 'GPS இருப்பிடம்' : 'GPS Locate'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-[#081813] border border-white/15 hover:border-[#70B77E] text-white rounded-[8px] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* GPS Error Banner (if any) */}
      {gpsError && (
        <div className="bg-[#B8423A] text-white px-4 py-2 text-xs font-mono flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button onClick={() => setGpsError(null)} className="cursor-pointer text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================
          2. LEAFLET MAP CONTAINER
          ======================================================== */}
      <div className="relative flex-1 min-h-[420px] sm:min-h-[480px] w-full bg-[#081813]">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

        {/* Floating Drawing Status & Instruction Pill */}
        {isDrawing && (
          <div className="absolute top-4 left-4 z-20 bg-[#0B241B]/90 backdrop-blur-md border border-[#00E5FF]/40 text-[#F5F4EA] px-3.5 py-2 rounded-[10px] text-xs font-mono shadow-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
            <span>
              {polygonCoords.length === 0
                ? isTa
                  ? 'வரைபடத்தில் கிளிக் செய்து முதல் புள்ளியை வைக்கவும்'
                  : 'Click anywhere on satellite map to place 1st boundary corner'
                : isTa
                ? `${polygonCoords.length} புள்ளிகள் வைக்கப்பட்டன. முடிக்க முதல் புள்ளியை கிளிக் செய்யவும்.`
                : `${polygonCoords.length} vertices placed. Click 1st corner to close boundary.`}
            </span>
          </div>
        )}

        {/* Floating Search Bar */}
        <div className="absolute top-4 right-14 z-20 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              placeholder={isTa ? 'மாவட்டம் அல்லது Lat, Lng...' : 'District or Lat, Lng...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0B241B]/90 backdrop-blur-md border border-white/20 text-xs font-mono text-white px-3 py-1.5 rounded-l-[8px] focus:outline-none focus:border-[#00E5FF] w-48"
            />
            <button
              type="submit"
              className="bg-[#217451] hover:bg-[#1b5e42] text-white p-1.5 rounded-r-[8px] border-y border-r border-[#217451] cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Floating Drawing Action Panel (Bottom-Center of Map) */}
        {!readOnly && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 bg-[#0B241B]/95 backdrop-blur-md border border-white/15 p-2 rounded-[12px] shadow-xl max-w-[95%]">
            {!isDrawing ? (
              <>
                <button
                  onClick={handleStartDrawing}
                  className="px-4 py-2 bg-[#00E5FF] hover:bg-[#00cce6] text-[#0B241B] text-xs font-mono font-bold rounded-[8px] flex items-center gap-2 cursor-pointer transition-colors shadow-sm min-h-[38px]"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{polygonCoords.length > 0 ? (isTa ? 'மறு எல்லை வரைய' : 'Redraw Boundary') : (isTa ? 'எல்லை வரைக' : 'Draw Boundary')}</span>
                </button>

                {polygonCoords.length >= 3 && (
                  <button
                    onClick={handleClearBoundary}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs font-mono text-white/90 rounded-[8px] flex items-center gap-1.5 cursor-pointer transition-colors min-h-[38px]"
                    title="Clear current boundary"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#B8423A]" />
                    <span>{isTa ? 'நீக்கு' : 'Clear'}</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleUndoPoint}
                  disabled={polygonCoords.length === 0}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-mono text-white rounded-[8px] flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>{isTa ? 'முந்தைய புள்ளி' : 'Undo Point'}</span>
                </button>

                <button
                  onClick={handleFinishDrawing}
                  disabled={polygonCoords.length < 3}
                  className="px-4 py-2 bg-[#70B77E] hover:bg-[#83c690] disabled:opacity-40 text-[#0B241B] text-xs font-mono font-bold rounded-[8px] flex items-center gap-1.5 cursor-pointer transition-colors min-h-[38px]"
                >
                  <Check className="w-4 h-4" />
                  <span>{isTa ? 'எல்லையை முடி' : 'Finish Boundary'}</span>
                </button>

                <button
                  onClick={handleClearBoundary}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs font-mono text-white/80 rounded-[8px] flex items-center gap-1 cursor-pointer min-h-[38px]"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isTa ? 'ரத்து' : 'Cancel'}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          3. LIVE GEOSPATIAL MEASUREMENTS & CADASTRE DASHBOARD
          ======================================================== */}
      <div className="bg-[#081813] border-t border-white/10 p-4 sm:p-5 space-y-4">
        {/* Geometry Validation Notice if invalid */}
        {!measurements.isValid && measurements.validationError && (
          <div className="p-3 bg-[#B8423A]/20 border border-[#B8423A]/40 rounded-[8px] text-xs font-mono text-[#F5F4EA] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B8423A] shrink-0" />
            <span>{measurements.validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Metric 1: Acres */}
          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#70B77E] font-bold">
              {isTa ? 'ஏக்கர் பரப்பளவு' : 'CALCULATED ACRES'}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-white">
              {polygonCoords.length >= 3 ? measurements.acres.toFixed(2) : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">Acres</span>
            </div>
          </div>

          {/* Metric 2: Cents (Standard TN Unit) */}
          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#00E5FF] font-bold">
              {isTa ? 'சென்ட் பரப்பளவு' : 'TAMIL NADU CENTS'}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-white">
              {polygonCoords.length >= 3 ? measurements.cents.toFixed(1) : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">Cents</span>
            </div>
          </div>

          {/* Metric 3: Square Metres */}
          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-white/60 font-semibold">
              {isTa ? 'சதுர மீட்டர்கள்' : 'SQUARE METRES'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {polygonCoords.length >= 3 ? measurements.areaSqMeters.toLocaleString('en-IN') : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">m²</span>
            </div>
          </div>

          {/* Metric 4: Hectares */}
          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-white/60 font-semibold">
              {isTa ? 'ஹெக்டேர்' : 'HECTARES'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {polygonCoords.length >= 3 ? measurements.hectares.toFixed(3) : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">ha</span>
            </div>
          </div>

          {/* Metric 5: Perimeter */}
          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-mono uppercase text-white/60 font-semibold">
              {isTa ? 'சுற்றளவு' : 'PERIMETER'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {polygonCoords.length >= 3 ? measurements.perimeterMeters.toLocaleString('en-IN') : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">m</span>
            </div>
          </div>
        </div>

        {/* Footer Actions & Survey Transparency Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/10 text-xs font-mono text-white/60">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#B87922] shrink-0" />
            <span>
              {isTa
                ? 'விவசாயி வரைந்த எல்லை (தமிழ்நாடு நில அளவை / e-Adangal சரிபார்ப்பு இல்லை).'
                : 'Farmer-Mapped Boundary (Geodetic Turf.js calculation; unverified by Tamil Nadu Land Survey / e-Adangal).'}
            </span>
          </div>

          {onSaveBoundary && polygonCoords.length >= 3 && measurements.isValid && !readOnly && (
            <button
              onClick={handleCommitBoundary}
              className="px-4 py-2 bg-[#217451] hover:bg-[#1b5e42] text-white font-bold rounded-[8px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 text-[#70B77E]" />
              <span>{isTa ? 'இந்த பரப்பளவை பண்ணைக்குப் பயன்படுத்து' : 'Use Measured Area for Farm'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
