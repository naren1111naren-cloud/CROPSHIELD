import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import {
  FarmRecord,
  FarmBoundary,
  BoundarySurveyStatus,
  CadastralSourceMetadata,
  FarmerProfile,
} from '../../types';
import {
  SOUTH_INDIA_STATES,
  SOUTH_INDIA_DISTRICTS_GEODATA,
  getSouthIndiaDistrictGeo,
} from '../../config/southIndiaGeodata';
import {
  resolveFarmerLocation,
  ResolvedFarmerLocation,
} from '../../services/locationResolver';
import {
  TN_CADASTRAL_HIERARCHY,
  lookupCadastralParcel,
  parseImportedBoundaryFile,
  CadastralLookupResponse,
} from '../../services/cadastralService';
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
  Search,
  CheckCircle2,
  FileUp,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Navigation,
  Globe2,
} from 'lucide-react';

interface FarmGISMapProps {
  farms?: FarmRecord[];
  selectedFarm?: FarmRecord | null;
  onSelectFarm?: (farm: FarmRecord) => void;
  onSaveBoundary?: (
    boundary: FarmBoundary,
    measuredAcres: number,
    measuredCents: number
  ) => void;
  farmerProfile?: FarmerProfile | null;
  initialDistrict?: string;
  initialState?: string;
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
  farmerProfile,
  initialDistrict,
  initialState = 'Tamil Nadu',
  className = '',
  readOnly = false,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayTileLayerRef = useRef<L.LayerGroup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Location Resolution from profile/farm records
  const initialResolution = resolveFarmerLocation(farmerProfile, selectedFarm, farms);
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedFarmerLocation>(initialResolution);

  // South India State & District Navigation State
  const [selectedState, setSelectedState] = useState<string>(
    farmerProfile?.state || initialState || initialResolution.hierarchy.state || 'Tamil Nadu'
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialDistrict ||
      selectedFarm?.district ||
      farmerProfile?.district ||
      initialResolution.hierarchy.district ||
      'Karur'
  );

  // Drawing & Geometry State
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [initialCoords, setInitialCoords] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activeLayerType, setActiveLayerType] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Geolocation & Permissions State
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsConsentModalOpen, setIsGpsConsentModalOpen] = useState<boolean>(false);

  // Boundary Provenance & Official Cadastre Metadata
  const [boundaryStatus, setBoundaryStatus] = useState<BoundarySurveyStatus>('farmer_drawn');
  const [sourceMetadata, setSourceMetadata] = useState<CadastralSourceMetadata | undefined>(undefined);
  const [officialExtentAcres, setOfficialExtentAcres] = useState<number | undefined>(undefined);
  const [officialExtentCents, setOfficialExtentCents] = useState<number | undefined>(undefined);
  const [isProposedEdit, setIsProposedEdit] = useState<boolean>(false);

  // Cadastral Lookup Modal State
  const [isLookupModalOpen, setIsLookupModalOpen] = useState<boolean>(false);
  const [lookupDistrict, setLookupDistrict] = useState<string>(selectedDistrict);
  const [lookupTaluk, setLookupTaluk] = useState<string>('Karur');
  const [lookupVillage, setLookupVillage] = useState<string>('Thanthoni');
  const [lookupSurveyNo, setLookupSurveyNo] = useState<string>('');
  const [lookupSubdivNo, setLookupSubdivNo] = useState<string>('');
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<CadastralLookupResponse | null>(null);

  // File Upload Feedback
  const [importNotice, setImportNotice] = useState<string | null>(null);

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

  // Re-resolve location whenever selectedFarm or farmerProfile updates
  useEffect(() => {
    const nextResolution = resolveFarmerLocation(farmerProfile, selectedFarm, farms);
    setResolvedLocation(nextResolution);

    if (nextResolution.hierarchy.district) {
      setSelectedDistrict(nextResolution.hierarchy.district);
      setLookupDistrict(nextResolution.hierarchy.district);
    }
    if (nextResolution.hierarchy.state) {
      setSelectedState(nextResolution.hierarchy.state);
    }

    // Auto-fly map to the resolved location
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(nextResolution.coordinates, nextResolution.zoom, {
        duration: 1.2,
      });
    }
  }, [selectedFarm, farmerProfile, farms]);

  // Sync available taluks & villages for selected lookup district
  useEffect(() => {
    const distData = TN_CADASTRAL_HIERARCHY[lookupDistrict];
    if (distData) {
      const taluks = Object.keys(distData.taluks);
      if (taluks.length > 0 && !taluks.includes(lookupTaluk)) {
        setLookupTaluk(taluks[0]);
        const villages = distData.taluks[taluks[0]].villages;
        setLookupVillage(villages[0] || '');
      }
    }
  }, [lookupDistrict]);

  useEffect(() => {
    const distData = TN_CADASTRAL_HIERARCHY[lookupDistrict];
    if (distData && distData.taluks[lookupTaluk]) {
      const villages = distData.taluks[lookupTaluk].villages;
      if (villages.length > 0 && !villages.includes(lookupVillage)) {
        setLookupVillage(villages[0]);
      }
    }
  }, [lookupTaluk]);

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
      const geoJsonRing: [number, number][] = coords.map(([lat, lng]) => [lng, lat]);
      if (
        geoJsonRing[0][0] !== geoJsonRing[geoJsonRing.length - 1][0] ||
        geoJsonRing[0][1] !== geoJsonRing[geoJsonRing.length - 1][1]
      ) {
        geoJsonRing.push(geoJsonRing[0]);
      }

      const poly = turf.polygon([geoJsonRing]);
      const kinks = turf.kinks(poly);
      const isSelfIntersecting = kinks.features.length > 0;

      const areaSqM = turf.area(poly);
      const line = turf.polygonToLine(poly);
      const perimeterM = line
        ? (Array.isArray(line) ? 0 : turf.length(line, { units: 'kilometers' }) * 1000)
        : 0;

      const hectares = areaSqM / 10000;
      const acres = areaSqM / 4046.8564224;
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
            : 'Boundary lines self-intersect. Please drag vertices to form a simple polygon.'
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

  // Configure Layer: Hybrid Satellite vs Satellite Pure vs Streets
  const applyTileLayer = (map: L.Map, layerType: 'hybrid' | 'satellite' | 'streets') => {
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (overlayTileLayerRef.current) {
      map.removeLayer(overlayTileLayerRef.current);
      overlayTileLayerRef.current = null;
    }

    const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;

    if (layerType === 'hybrid') {
      if (maptilerKey) {
        const satHybrid = L.tileLayer(
          `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${maptilerKey}`,
          {
            maxZoom: 20,
            attribution:
              '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          }
        );
        satHybrid.addTo(map);
        baseTileLayerRef.current = satHybrid;
      } else {
        const sat = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution:
              'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          }
        );
        sat.addTo(map);
        baseTileLayerRef.current = sat;

        const roads = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19, opacity: 0.95 }
        );
        const places = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19, opacity: 0.95 }
        );
        const overlayGroup = L.layerGroup([roads, places]).addTo(map);
        overlayTileLayerRef.current = overlayGroup;
      }
    } else if (layerType === 'satellite') {
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }
      );
      sat.addTo(map);
      baseTileLayerRef.current = sat;
    } else {
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      osm.addTo(map);
      baseTileLayerRef.current = osm;
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = resolvedLocation.coordinates[0];
    const initialLng = resolvedLocation.coordinates[1];
    const initialZoom = resolvedLocation.zoom;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    vertexMarkersLayerRef.current = L.layerGroup().addTo(map);
    savedFarmsLayerGroupRef.current = L.layerGroup().addTo(map);

    applyTileLayer(map, 'hybrid');

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Layer
  const handleSwitchLayer = (layerType: 'hybrid' | 'satellite' | 'streets') => {
    if (!mapInstanceRef.current) return;
    setActiveLayerType(layerType);
    applyTileLayer(mapInstanceRef.current, layerType);
  };

  // State Change Handler
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const stateObj = SOUTH_INDIA_STATES[stateName];
    if (stateObj && stateObj.districts.length > 0) {
      const firstDist = stateObj.districts[0];
      setSelectedDistrict(firstDist);
      setLookupDistrict(firstDist);

      const distGeo = getSouthIndiaDistrictGeo(firstDist);
      if (distGeo && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([distGeo.latitude, distGeo.longitude], distGeo.zoomLevel || 12, {
          duration: 1.5,
        });
      }
    }
  };

  // Fly to District
  const handleDistrictChange = (distKey: string) => {
    setSelectedDistrict(distKey);
    setLookupDistrict(distKey);
    const geo = getSouthIndiaDistrictGeo(distKey);
    if (geo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([geo.latitude, geo.longitude], geo.zoomLevel || 12, {
        duration: 1.2,
      });
    }
  };

  // Explicit User GPS Location Action (with permission explanation)
  const handleRequestGpsLocation = () => {
    setIsGpsConsentModalOpen(true);
  };

  const handleConfirmGpsPermission = () => {
    setIsGpsConsentModalOpen(false);

    if (!navigator.geolocation) {
      setGpsError(
        isTa
          ? 'உங்கள் உலாவியில் GPS ஆதரிக்கப்படவில்லை.'
          : 'Geolocation is not supported by your browser.'
      );
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
        if (err.code === 1)
          msg = isTa
            ? 'GPS இருப்பிட அனுமதி மறுக்கப்பட்டது. உங்கள் சுயவிவர இருப்பிடத்தைப் பயன்படுத்தலாம்.'
            : 'Location permission was denied. You can continue using your saved profile district.';
        else if (err.code === 2)
          msg = isTa ? 'GPS இருப்பிடத்தைக் கண்டறிய முடியவில்லை.' : 'GPS position unavailable.';
        else if (err.code === 3)
          msg = isTa ? 'இருப்பிட நேரம் முடிவடைந்தது.' : 'GPS location request timed out.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Re-center on Saved Location / Profile District
  const handleLocateSavedDistrict = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(resolvedLocation.coordinates, resolvedLocation.zoom, {
        duration: 1.2,
      });
    }
  };

  // Search Location / Coordinates Query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const coordParts = searchQuery.split(',').map((s) => parseFloat(s.trim()));
    if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
      const [lat, lng] = coordParts;
      if (lat >= 8 && lat <= 20 && lng >= 74 && lng <= 85) {
        mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
        return;
      }
    }

    const matchedDist = getSouthIndiaDistrictGeo(searchQuery);
    if (matchedDist) {
      handleDistrictChange(matchedDist.name);
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

    const liveMetrics = calculateLiveMeasurements(polygonCoords);
    setMeasurements(liveMetrics);

    if (activePolygonLayerRef.current) {
      activePolygonLayerRef.current.remove();
      activePolygonLayerRef.current = null;
    }

    if (vertexMarkersLayerRef.current) {
      vertexMarkersLayerRef.current.clearLayers();
    }

    if (polygonCoords.length === 0) return;

    let polyStrokeColor = '#00E5FF';
    let polyFillColor = '#00E5FF';
    let vertexBgColor = 'bg-[#00E5FF] text-[#0B241B]';

    if (boundaryStatus === 'official_source') {
      polyStrokeColor = '#F59E0B';
      polyFillColor = '#F59E0B';
      vertexBgColor = 'bg-[#F59E0B] text-[#183B2A]';
    } else if (boundaryStatus === 'imported') {
      polyStrokeColor = '#A855F7';
      polyFillColor = '#A855F7';
      vertexBgColor = 'bg-[#A855F7] text-white';
    }

    if (!liveMetrics.isValid) {
      polyStrokeColor = '#B8423A';
      polyFillColor = '#B8423A';
    }

    const polygon = L.polygon(polygonCoords, {
      color: polyStrokeColor,
      weight: 3,
      opacity: 0.95,
      fillColor: polyFillColor,
      fillOpacity: 0.22,
      dashArray: isDrawing ? '6 6' : undefined,
    });

    polygon.addTo(map);
    activePolygonLayerRef.current = polygon;

    if (!readOnly && vertexMarkersLayerRef.current) {
      polygonCoords.forEach((pt, index) => {
        const isFirst = index === 0;
        const vertexIcon = L.divIcon({
          className: 'custom-vertex-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-move group">
              <div class="w-6 h-6 rounded-full ${
                isFirst && isDrawing ? 'bg-[#70B77E] ring-2 ring-white' : vertexBgColor
              } border-2 border-[#0B241B] flex items-center justify-center text-[10px] font-mono font-bold shadow-md hover:scale-125 transition-transform">
                ${index + 1}
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(pt, {
          icon: vertexIcon,
          draggable: !isDrawing,
        });

        if (isDrawing && isFirst && polygonCoords.length >= 3) {
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setIsDrawing(false);
          });
        }

        marker.on('drag', (e: any) => {
          const newPos = e.target.getLatLng();
          if (boundaryStatus === 'official_source') {
            setIsProposedEdit(true);
          }
          setPolygonCoords((prev) => {
            const next = [...prev];
            next[index] = [newPos.lat, newPos.lng];
            return next;
          });
        });

        vertexMarkersLayerRef.current?.addLayer(marker);
      });
    }
  }, [polygonCoords, isDrawing, readOnly, boundaryStatus]);

  // Load Selected Farm's boundary if supplied
  useEffect(() => {
    if (selectedFarm && selectedFarm.boundary?.coordinates && selectedFarm.boundary.coordinates.length > 0) {
      try {
        const ring = selectedFarm.boundary.coordinates[0];
        const leafletCoords: [number, number][] = ring
          .slice(0, ring.length - 1)
          .map(([lng, lat]) => [lat, lng]);

        setPolygonCoords(leafletCoords);
        setInitialCoords(leafletCoords);
        setIsDrawing(false);
        setBoundaryStatus(selectedFarm.boundary.surveyStatus || 'farmer_drawn');
        setSourceMetadata(selectedFarm.boundary.sourceMetadata);
        setOfficialExtentAcres(selectedFarm.boundary.officialExtentAcres);
        setOfficialExtentCents(selectedFarm.boundary.officialExtentCents);
        setIsProposedEdit(false);

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
      if (farm.id === selectedFarm?.id) return;
      if (farm.boundary?.coordinates && farm.boundary.coordinates.length > 0) {
        try {
          const ring = farm.boundary.coordinates[0];
          const coords: [number, number][] = ring.map(([lng, lat]) => [lat, lng]);

          const isOfficial = farm.boundary.surveyStatus === 'official_source';
          const isImported = farm.boundary.surveyStatus === 'imported';

          const strokeColor = isOfficial ? '#F59E0B' : isImported ? '#A855F7' : farm.isPrimary ? '#70B77E' : '#DFE6DB';
          const fillColor = isOfficial ? '#F59E0B' : isImported ? '#A855F7' : farm.isPrimary ? '#70B77E' : '#B8DCC1';

          const savedPoly = L.polygon(coords, {
            color: strokeColor,
            weight: 2,
            opacity: 0.8,
            fillColor,
            fillOpacity: 0.15,
          });

          const statusBadge = isOfficial ? '🏛️ Official Cadastre' : isImported ? '📂 Imported Survey' : '✏️ Farmer-Mapped';

          savedPoly.bindTooltip(`
            <div style="font-family: Plus Jakarta Sans, sans-serif; font-size: 12px; color: #0B241B;">
              <strong>${farm.farmName}</strong> (${farm.cropType})<br/>
              <span style="font-family: monospace; color: #217451;">${farm.landSizeArea || farm.landSizeAcres || '—'} ${farm.areaUnit || 'Acres'}</span><br/>
              <span style="font-size: 10px; color: #64766B;">${statusBadge}</span>
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
    setBoundaryStatus('farmer_drawn');
    setIsProposedEdit(false);
  };

  const handleUndoPoint = () => {
    setPolygonCoords((prev) => prev.slice(0, -1));
  };

  const handleFinishDrawing = () => {
    if (polygonCoords.length < 3) return;
    setIsDrawing(false);
  };

  const handleClearBoundary = () => {
    setPolygonCoords([]);
    setIsDrawing(false);
    setSourceMetadata(undefined);
    setOfficialExtentAcres(undefined);
    setOfficialExtentCents(undefined);
    setIsProposedEdit(false);
  };

  const handleRevertEdits = () => {
    if (initialCoords.length >= 3) {
      setPolygonCoords([...initialCoords]);
      setIsProposedEdit(false);
    }
  };

  // Official Cadastral Query Handler
  const handleCadastralLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupSurveyNo.trim()) return;

    setLookupLoading(true);
    setLookupResult(null);

    const res = await lookupCadastralParcel({
      district: lookupDistrict,
      taluk: lookupTaluk,
      village: lookupVillage,
      surveyNumber: lookupSurveyNo.trim(),
      subdivisionNumber: lookupSubdivNo.trim() || undefined,
    });

    setLookupLoading(false);
    setLookupResult(res);
  };

  const handleApplyOfficialBoundary = (res: CadastralLookupResponse) => {
    if (res.boundary && res.boundary.coordinates.length > 0) {
      const ring = res.boundary.coordinates[0];
      const coords: [number, number][] = ring.slice(0, ring.length - 1).map(([lng, lat]) => [lat, lng]);
      setPolygonCoords(coords);
      setInitialCoords(coords);
      setBoundaryStatus('official_source');
      setSourceMetadata(res.boundary.sourceMetadata);
      setOfficialExtentAcres(res.officialExtentAcres);
      setOfficialExtentCents(res.officialExtentCents);
      setIsProposedEdit(false);
      setIsLookupModalOpen(false);

      if (mapInstanceRef.current && coords.length >= 3) {
        const poly = L.polygon(coords);
        mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [40, 40], maxZoom: 18 });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = parseImportedBoundaryFile(content, file.name);

        const ring = imported.coordinates[0];
        const coords: [number, number][] = ring.slice(0, ring.length - 1).map(([lng, lat]) => [lat, lng]);

        setPolygonCoords(coords);
        setInitialCoords(coords);
        setBoundaryStatus('imported');
        setSourceMetadata(imported.sourceMetadata);
        setIsProposedEdit(false);
        setImportNotice(
          isTa
            ? `நில அளவை கோப்பு வெற்றிகரமாக இறக்கப்பட்டது: ${file.name}`
            : `Survey boundary imported successfully from ${file.name}`
        );
        setTimeout(() => setImportNotice(null), 4000);

        if (mapInstanceRef.current && coords.length >= 3) {
          const poly = L.polygon(coords);
          mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [40, 40], maxZoom: 18 });
        }
      } catch (err: any) {
        setImportNotice(`Import Error: ${err.message}`);
        setTimeout(() => setImportNotice(null), 5000);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleCommitBoundary = () => {
    if (polygonCoords.length < 3 || !measurements.isValid) return;

    const geoJsonRing: [number, number][] = polygonCoords.map(([lat, lng]) => [lng, lat]);
    geoJsonRing.push(geoJsonRing[0]);

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
      surveyStatus: boundaryStatus,
      sourceMetadata,
      officialExtentAcres,
      officialExtentCents,
      mappedAt: new Date().toISOString(),
    };

    onSaveBoundary?.(boundaryData, measurements.acres, measurements.cents);
  };

  const availableDistricts = SOUTH_INDIA_STATES[selectedState]?.districts || [];

  return (
    <div
      className={`relative bg-[#0B241B] text-[#F5F4EA] rounded-[16px] overflow-hidden border border-[#217451]/30 shadow-md flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : className
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".geojson,.json"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload GeoJSON Survey File"
      />

      {/* ========================================================
          1. GIS WORKSPACE TOP TOOLBAR (South India Aware)
          ======================================================== */}
      <div className="bg-[#0B241B] border-b border-white/10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#217451] flex items-center justify-center text-white shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-[#70B77E] font-bold flex items-center gap-1.5">
              <span>SOUTH INDIA LOCATION-AWARE GIS</span>
              <span>·</span>
              <span className="text-white/60">HYBRID CADASTRE</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <span>{isTa ? 'செயற்கைக்கோள் நில வரைபடம் & பரப்பளவு' : 'Interactive Cadastre & Live Farm Measurement'}</span>
            </h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* South India State Selector */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="bg-[#081813] border border-white/15 text-xs font-mono text-[#70B77E] font-bold px-2.5 py-1.5 rounded-[8px] cursor-pointer focus:border-[#70B77E] min-h-[36px]"
              aria-label="Select South Indian State"
            >
              {Object.keys(SOUTH_INDIA_STATES).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-[#081813] border border-white/15 text-xs font-mono text-[#F5F4EA] px-2.5 py-1.5 rounded-[8px] cursor-pointer focus:border-[#70B77E] min-h-[36px]"
              aria-label="Select District"
            >
              {availableDistricts.map((dist) => {
                const geo = SOUTH_INDIA_DISTRICTS_GEODATA[dist];
                return (
                  <option key={dist} value={dist}>
                    {dist} {geo?.nameTamil ? `(${geo.nameTamil})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Layer Selector: Hybrid vs Satellite vs Streets */}
          <div
            className="flex items-center bg-[#081813] border border-white/15 rounded-[8px] p-0.5 text-xs font-mono"
            role="group"
            aria-label="Map Layer Toggle"
          >
            <button
              onClick={() => handleSwitchLayer('hybrid')}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeLayerType === 'hybrid'
                  ? 'bg-[#217451] text-white font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
              aria-pressed={activeLayerType === 'hybrid'}
              title="Satellite imagery with roads and geographic labels"
            >
              Hybrid
            </button>
            <button
              onClick={() => handleSwitchLayer('satellite')}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeLayerType === 'satellite'
                  ? 'bg-[#217451] text-white font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
              aria-pressed={activeLayerType === 'satellite'}
              title="Pure satellite imagery"
            >
              Sat
            </button>
            <button
              onClick={() => handleSwitchLayer('streets')}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeLayerType === 'streets'
                  ? 'bg-[#217451] text-white font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
              aria-pressed={activeLayerType === 'streets'}
              title="OpenStreetMap vector streets"
            >
              Streets
            </button>
          </div>

          {/* Official Cadastre Lookup Button */}
          <button
            onClick={() => setIsLookupModalOpen(true)}
            className="px-3 py-1.5 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 border border-[#F59E0B]/40 text-[#F59E0B] text-xs font-mono font-bold rounded-[8px] flex items-center gap-1.5 cursor-pointer min-h-[36px] transition-colors"
            title="Lookup official government survey & subdivision record"
          >
            <Landmark className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">{isTa ? 'அரசு நில அளவை' : 'Official Cadastre'}</span>
          </button>

          {/* Import Survey File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-[#A855F7]/20 hover:bg-[#A855F7]/30 border border-[#A855F7]/40 text-[#A855F7] text-xs font-mono font-bold rounded-[8px] flex items-center gap-1.5 cursor-pointer min-h-[36px] transition-colors"
            title="Import surveyor GeoJSON / spatial file"
          >
            <FileUp className="w-3.5 h-3.5 text-[#A855F7]" />
            <span className="hidden sm:inline">Import GeoJSON</span>
          </button>

          {/* Explicit GPS Locate Button */}
          <button
            onClick={handleRequestGpsLocation}
            disabled={gpsLoading}
            className="px-3 py-1.5 bg-[#081813] border border-white/15 hover:border-[#70B77E] text-xs font-mono text-[#F5F4EA] rounded-[8px] flex items-center gap-1.5 cursor-pointer min-h-[36px] transition-colors"
            title="Locate with device GPS (requests explicit browser permission)"
          >
            <Crosshair className={`w-3.5 h-3.5 text-[#00E5FF] ${gpsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isTa ? 'GPS இருப்பிடம்' : 'Use Current Location'}</span>
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

      {/* ========================================================
          LOCATION HIERARCHY BREADCRUMB & RESOLUTION BANNER
          ======================================================== */}
      <div className="bg-[#081813] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-white/70 flex-wrap">
          <Globe2 className="w-3.5 h-3.5 text-[#70B77E] shrink-0" />
          <span className="text-white/40 uppercase">HIERARCHY:</span>
          <span className="font-bold text-white">India</span>
          <span className="text-white/40">❯</span>
          <span className="text-[#70B77E] font-semibold">{resolvedLocation.hierarchy.state}</span>
          {resolvedLocation.hierarchy.district && (
            <>
              <span className="text-white/40">❯</span>
              <span className="text-white font-bold">{resolvedLocation.hierarchy.district}</span>
            </>
          )}
          {resolvedLocation.hierarchy.taluk && (
            <>
              <span className="text-white/40">❯</span>
              <span className="text-white/80">{resolvedLocation.hierarchy.taluk} Taluk</span>
            </>
          )}
          {resolvedLocation.hierarchy.village && (
            <>
              <span className="text-white/40">❯</span>
              <span className="text-[#00E5FF]">{resolvedLocation.hierarchy.village}</span>
            </>
          )}
          {resolvedLocation.hierarchy.parcelName && (
            <>
              <span className="text-white/40">❯</span>
              <span className="text-[#F59E0B] font-bold">"{resolvedLocation.hierarchy.parcelName}"</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {resolvedLocation.isExactField ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#217451]/30 text-[#70B77E] border border-[#70B77E]/40 text-[11px] font-bold">
              🎯 Exact Farm Boundary Loaded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 text-[11px] font-bold">
              📍 District Center ({resolvedLocation.hierarchy.district || 'Regional'}) · Field Unmapped
            </span>
          )}
        </div>
      </div>

      {/* Resolution Guidance Notice */}
      <div className="bg-[#0B241B]/95 border-b border-white/10 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans text-white/80">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#70B77E] shrink-0" />
          <span>{resolvedLocation.actionGuidance}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
          <button
            onClick={handleLocateSavedDistrict}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-[6px] cursor-pointer flex items-center gap-1 transition-colors"
            title="Re-center on saved profile location"
          >
            <Compass className="w-3 h-3 text-[#70B77E]" />
            <span>Locate My District</span>
          </button>
        </div>
      </div>

      {/* Import / Error Notifications */}
      {importNotice && (
        <div className="bg-[#217451] text-white px-4 py-2 text-xs font-mono flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#70B77E]" />
            <span>{importNotice}</span>
          </div>
          <button onClick={() => setImportNotice(null)} className="cursor-pointer text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
          <div className="absolute top-4 left-4 z-20 bg-[#0B241B]/95 backdrop-blur-md border border-[#00E5FF]/40 text-[#F5F4EA] px-3.5 py-2 rounded-[10px] text-xs font-mono shadow-lg flex items-center gap-2">
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

        {/* Floating Boundary Provenance Tag */}
        {polygonCoords.length >= 3 && !isDrawing && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            {boundaryStatus === 'official_source' ? (
              <div className="bg-[#F59E0B]/90 backdrop-blur-md border border-[#F59E0B] text-[#183B2A] font-bold px-3 py-1.5 rounded-[8px] text-xs font-mono shadow-lg flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#183B2A]" />
                <span>
                  OFFICIAL CADASTRE · {sourceMetadata?.surveyNumber ? `Survey ${sourceMetadata.surveyNumber}` : 'Verified'}
                </span>
              </div>
            ) : boundaryStatus === 'imported' ? (
              <div className="bg-[#A855F7]/90 backdrop-blur-md border border-[#A855F7] text-white font-bold px-3 py-1.5 rounded-[8px] text-xs font-mono shadow-lg flex items-center gap-1.5">
                <FileUp className="w-3.5 h-3.5 text-white" />
                <span>IMPORTED SURVEY · {sourceMetadata?.fileName || 'File'}</span>
              </div>
            ) : (
              <div className="bg-[#0B241B]/90 backdrop-blur-md border border-[#00E5FF]/40 text-[#00E5FF] font-bold px-3 py-1.5 rounded-[8px] text-xs font-mono shadow-lg flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>FARMER-MAPPED (UNVERIFIED)</span>
              </div>
            )}

            {isProposedEdit && (
              <div className="bg-[#B8423A]/90 text-white font-mono text-[11px] px-2.5 py-1 rounded-[6px] shadow-sm">
                Proposed User Adjustment
              </div>
            )}
          </div>
        )}

        {/* Floating Search Bar */}
        <div className="absolute top-4 right-14 z-20 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              placeholder={isTa ? 'மாவட்டம் அல்லது Lat, Lng...' : 'District, town, or Lat, Lng...'}
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
                  <span>
                    {polygonCoords.length > 0
                      ? isTa
                        ? 'மறு எல்லை வரைய'
                        : 'Redraw Boundary'
                      : isTa
                      ? 'எல்லை வரைக'
                      : 'Draw Farm Boundary'}
                  </span>
                </button>

                {initialCoords.length >= 3 && isProposedEdit && (
                  <button
                    onClick={handleRevertEdits}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs font-mono text-white rounded-[8px] flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                    title="Revert to original loaded geometry"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{isTa ? 'மீட்டமை' : 'Revert Edits'}</span>
                  </button>
                )}

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
        {!measurements.isValid && measurements.validationError && (
          <div className="p-3 bg-[#B8423A]/20 border border-[#B8423A]/40 rounded-[8px] text-xs font-mono text-[#F5F4EA] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B8423A] shrink-0" />
            <span>{measurements.validationError}</span>
          </div>
        )}

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#70B77E] font-bold">
              {isTa ? 'ஏக்கர் பரப்பளவு' : 'CALCULATED ACRES'}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-white">
              {polygonCoords.length >= 3 ? measurements.acres.toFixed(2) : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">Acres</span>
            </div>
          </div>

          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#00E5FF] font-bold">
              {isTa ? 'சென்ட் பரப்பளவு' : 'TAMIL NADU CENTS'}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-white">
              {polygonCoords.length >= 3 ? measurements.cents.toFixed(1) : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">Cents</span>
            </div>
          </div>

          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-white/60 font-semibold">
              {isTa ? 'சதுர மீட்டர்கள்' : 'SQUARE METRES'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {polygonCoords.length >= 3 ? measurements.areaSqMeters.toLocaleString('en-IN') : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">m²</span>
            </div>
          </div>

          <div className="bg-[#0B241B] border border-white/10 p-3 rounded-[10px] space-y-1">
            <div className="text-[10px] font-mono uppercase text-white/60 font-semibold">
              {isTa ? 'ஹெக்டேர்' : 'HECTARES'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {polygonCoords.length >= 3 ? measurements.hectares.toFixed(3) : '—'}
              <span className="text-xs font-normal text-white/60 ml-1">ha</span>
            </div>
          </div>

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

        {/* Cadastral Extent Comparison */}
        {officialExtentAcres !== undefined && (
          <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-[8px] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#F59E0B]">
            <div className="flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>
                OFFICIAL RECORDED EXTENT: <strong>{officialExtentAcres} Acres</strong> ({officialExtentCents} Cents)
              </span>
            </div>
            <span className="text-white/60 text-[11px]">
              Geodesic Variance: {(measurements.acres - officialExtentAcres).toFixed(2)} Ac
            </span>
          </div>
        )}

        {/* Footer Actions & Survey Transparency Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/10 text-xs font-mono text-white/60">
          <div className="flex items-center gap-2">
            {boundaryStatus === 'official_source' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-[#F59E0B]">
                  Official Government Survey Record · {sourceMetadata?.provider || 'TNGIS'}
                </span>
              </>
            ) : boundaryStatus === 'imported' ? (
              <>
                <FileUp className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                <span className="text-[#A855F7]">
                  Imported Geospatial Record · {sourceMetadata?.fileName || 'Spatial File'}
                </span>
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5 text-[#B87922] shrink-0" />
                <span>
                  {isTa
                    ? 'விவசாயி வரைந்த எல்லை (தமிழ்நாடு நில அளவை / e-Adangal சரிபார்ப்பு இல்லை).'
                    : 'Farmer-Mapped Boundary (Geodetic Turf.js calculation; unverified by Tamil Nadu Land Survey / e-Adangal).'}
                </span>
              </>
            )}
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

      {/* ========================================================
          4. OFFICIAL CADASTRAL LOOKUP MODAL
          ======================================================== */}
      {isLookupModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0B241B] border-2 border-[#F59E0B]/50 max-w-lg w-full p-6 shadow-2xl rounded-[14px] text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold">
                  {isTa ? 'தமிழ்நாடு அரசு நில அளவை சரிபார்ப்பு' : 'Official Cadastral Record Lookup'}
                </h3>
              </div>
              <button
                onClick={() => setIsLookupModalOpen(false)}
                className="text-white/60 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-sans text-white/70 leading-relaxed">
              {isTa
                ? 'உங்கள் மாவட்ட, தாலுகா, வருவாய் கிராமம் மற்றும் புல எண் (Survey Number) விவரங்களை உள்ளிட்டு அரசு நில அளவை பதிவேட்டை சரிபார்க்கவும்.'
                : 'Enter your Revenue District, Taluk, Village, Survey Number, and Subdivision Number to query official cadastral land records.'}
            </p>

            <form onSubmit={handleCadastralLookup} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 uppercase font-semibold mb-1">District</label>
                  <select
                    value={lookupDistrict}
                    onChange={(e) => setLookupDistrict(e.target.value)}
                    className="w-full p-2 bg-[#081813] border border-white/20 rounded-[6px] text-white"
                  >
                    {Object.keys(TN_CADASTRAL_HIERARCHY).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 uppercase font-semibold mb-1">Taluk</label>
                  <select
                    value={lookupTaluk}
                    onChange={(e) => setLookupTaluk(e.target.value)}
                    className="w-full p-2 bg-[#081813] border border-white/20 rounded-[6px] text-white"
                  >
                    {TN_CADASTRAL_HIERARCHY[lookupDistrict] &&
                      Object.keys(TN_CADASTRAL_HIERARCHY[lookupDistrict].taluks).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 uppercase font-semibold mb-1">Revenue Village</label>
                  <select
                    value={lookupVillage}
                    onChange={(e) => setLookupVillage(e.target.value)}
                    className="w-full p-2 bg-[#081813] border border-white/20 rounded-[6px] text-white"
                  >
                    {TN_CADASTRAL_HIERARCHY[lookupDistrict]?.taluks[lookupTaluk]?.villages.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block text-white/80 uppercase font-semibold mb-1">Survey No *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 142"
                      value={lookupSurveyNo}
                      onChange={(e) => setLookupSurveyNo(e.target.value)}
                      className="w-full p-2 bg-[#081813] border border-white/20 rounded-[6px] text-white"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-white/80 uppercase font-semibold mb-1">Subdiv No</label>
                    <input
                      type="text"
                      placeholder="e.g. 2B"
                      value={lookupSubdivNo}
                      onChange={(e) => setLookupSubdivNo(e.target.value)}
                      className="w-full p-2 bg-[#081813] border border-white/20 rounded-[6px] text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#d98205] text-[#0B241B] font-bold rounded-[8px] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                {lookupLoading ? <Crosshair className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{lookupLoading ? 'Querying Revenue Registry...' : 'Search Official Cadastre Record'}</span>
              </button>
            </form>

            {lookupResult && (
              <div
                className={`p-4 rounded-[10px] border text-xs font-mono space-y-2.5 ${
                  lookupResult.success
                    ? 'bg-[#217451]/30 border-[#70B77E] text-[#F5F4EA]'
                    : 'bg-[#B8423A]/15 border-[#B8423A]/40 text-[#F5F4EA]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {lookupResult.success ? (
                    <ShieldCheck className="w-5 h-5 text-[#70B77E] shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white">
                      {lookupResult.success ? 'Official Record Located' : 'Authorized State Integration Required'}
                    </div>
                    <p className="text-white/80 font-sans leading-relaxed">{lookupResult.message}</p>
                  </div>
                </div>

                {lookupResult.technicalDetails && (
                  <div className="p-2.5 bg-black/40 rounded-[6px] text-[11px] text-white/70 space-y-1">
                    <span className="text-[#F59E0B] font-bold block">TECHNICAL ARCHITECTURE NOTICE:</span>
                    <span>{lookupResult.technicalDetails}</span>
                  </div>
                )}

                {lookupResult.success && lookupResult.boundary && (
                  <button
                    onClick={() => handleApplyOfficialBoundary(lookupResult)}
                    className="w-full py-2 bg-[#70B77E] hover:bg-[#83c690] text-[#0B241B] font-bold rounded-[6px] flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Official Boundary to Map</span>
                  </button>
                )}

                {!lookupResult.success && (
                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLookupModalOpen(false);
                        handleStartDrawing();
                        setSourceMetadata({
                          provider: 'Farmer-Drawn with Official Revenue References',
                          district: lookupDistrict,
                          taluk: lookupTaluk,
                          revenueVillage: lookupVillage,
                          surveyNumber: lookupSurveyNo,
                          subdivisionNumber: lookupSubdivNo,
                          retrievedAt: new Date().toISOString(),
                          licenseNotice: lookupResult.licenseNotice,
                        });
                      }}
                      className="flex-1 py-2 bg-[#00E5FF] hover:bg-[#00cce6] text-[#0B241B] font-bold rounded-[6px] text-center cursor-pointer transition-colors"
                    >
                      Draw Estimated Outline for Survey {lookupSurveyNo}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLookupModalOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-[6px] text-center cursor-pointer transition-colors"
                    >
                      Import GeoJSON File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. EXPLICIT GPS CONSENT & PERMISSION MODAL
          ======================================================== */}
      {isGpsConsentModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0B241B] border-2 border-[#00E5FF]/40 max-w-md w-full p-6 shadow-2xl rounded-[14px] text-white space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-9 h-9 rounded-full bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white">
                  {isTa ? 'GPS இருப்பிட அனுமதி' : 'Device Location Access'}
                </h3>
                <span className="text-xs font-mono text-[#70B77E]">EXPLICIT PERMISSION REQUIRED</span>
              </div>
            </div>

            <p className="text-xs font-sans text-white/80 leading-relaxed">
              {isTa
                ? 'செயற்கைக்கோள் வரைபடத்தில் உங்கள் தற்போதைய வயல்வெளியை தானாகக் கண்டறிய உங்கள் உலாவியின் GPS இருப்பிட அனுமதி தேவைப்படுகிறது. உங்கள் இருப்பிடம் வேறு எங்கும் பகிரப்படாது.'
                : 'CropShield AI requests your browser GPS permission strictly to center the satellite map at your current field location to assist you in outlining boundaries. Your device coordinates are not saved without your explicit confirmation.'}
            </p>

            <div className="p-3 bg-black/40 rounded-[8px] text-[11px] font-mono text-white/70 space-y-1">
              <span className="text-[#00E5FF] font-bold block">CURRENT SAVED LOCATION:</span>
              <span>
                {resolvedLocation.hierarchy.district}, {resolvedLocation.hierarchy.state} ({resolvedLocation.statusMessage})
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsGpsConsentModalOpen(false)}
                className="px-4 py-2 text-xs font-mono text-white/70 hover:text-white cursor-pointer"
              >
                {isTa ? 'ரத்துசெய்' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmGpsPermission}
                className="px-5 py-2.5 bg-[#00E5FF] hover:bg-[#00cce6] text-[#0B241B] font-mono text-xs font-bold rounded-[8px] cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{isTa ? 'அனுமதிக்கவும் & கண்டறியவும்' : 'Allow & Locate Field'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
