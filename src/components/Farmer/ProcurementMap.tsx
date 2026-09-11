import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  GeoCoordinates,
  ProcurementCentre,
  FarmerLocation,
  CentreIntelligence,
} from '../../types';
import { buildGoogleMapsDirectionsUrl } from '../../utils/locationIntelligence';
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  Info,
  Clock,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface ProcurementMapProps {
  farmerLocation: FarmerLocation;
  centresIntelligence: CentreIntelligence[];
  selectedCentreId: string;
  onSelectCentre: (centreId: string) => void;
  onOpenDetails: (centreId: string) => void;
  crop?: string;
}

/**
 * Camera controller for Google Maps instance:
 * Synchronizes the Google Maps viewport when the farmer origin coordinates change.
 * Pans to the new origin and sets a comfortable regional zoom level (11) so the origin
 * and nearby procurement centres are immediately visible.
 *
 * It ONLY moves the camera when coordinates actually change, allowing the user
 * to freely zoom out to view all of India or pan the map without being forced back.
 */
interface MapCameraControllerProps {
  origin: { lat: number; lng: number };
}

const MapCameraController: React.FC<MapCameraControllerProps> = ({ origin }) => {
  const map = useMap();
  const prevOriginRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map) return;
    const prev = prevOriginRef.current;
    if (!prev || prev.lat !== origin.lat || prev.lng !== origin.lng) {
      prevOriginRef.current = { lat: origin.lat, lng: origin.lng };
      map.panTo(origin);
      map.setZoom(11);
    }
  }, [map, origin.lat, origin.lng]);

  return null;
};

/**
 * Custom viewport controls for Google Maps mode:
 * Provides immediate buttons to view all centres across India or re-center on farmer origin.
 */
interface GoogleMapControlsProps {
  origin: { lat: number; lng: number };
  centres: CentreIntelligence[];
}

const GoogleMapControls: React.FC<GoogleMapControlsProps> = ({ origin, centres }) => {
  const map = useMap();

  const handleShowAllIndia = () => {
    if (!map) return;
    try {
      if (typeof window !== 'undefined' && (window as unknown as { google?: { maps?: { LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void } } } }).google?.maps?.LatLngBounds) {
        const bounds = new (window as unknown as { google: { maps: { LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void } } } }).google.maps.LatLngBounds();
        bounds.extend(origin);
        centres.forEach((ci) => {
          if (ci.centre.coordinates) {
            bounds.extend({ lat: ci.centre.coordinates.lat, lng: ci.centre.coordinates.lng });
          }
        });
        map.fitBounds(bounds as unknown as google.maps.LatLngBounds, 45);
        return;
      }
    } catch {
      // Fallback zoom out
    }
    map.panTo({ lat: 21.7679, lng: 78.8718 });
    map.setZoom(5);
  };

  const handleRecenter = () => {
    if (!map) return;
    map.panTo(origin);
    map.setZoom(11);
  };

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
      <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-md">
        <button
          type="button"
          onClick={handleShowAllIndia}
          className="px-2.5 py-1 rounded-xl transition-colors cursor-pointer text-[11px] hover:text-white hover:bg-slate-800"
          title="Zoom out to see all procurement centres across India"
        >
          All {centres.length} Centres
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="px-2.5 py-1 rounded-xl transition-colors cursor-pointer text-[11px] bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-500"
          title="Center on your origin"
        >
          My Origin
        </button>
      </div>
    </div>
  );
};

export const ProcurementMap: React.FC<ProcurementMapProps> = ({
  farmerLocation,
  centresIntelligence,
  selectedCentreId,
  onSelectCentre,
  onOpenDetails,
  crop,
}) => {
  // Safely check for optional Vite Google Maps API key
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const apiKey = metaEnv?.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasApiKey = Boolean(apiKey && apiKey.trim().length > 5);

  const [zoomLevel] = useState<number>(11);

  const selectedIntelligence = useMemo(() => {
    return (
      centresIntelligence.find((c) => c.centre.id === selectedCentreId) ||
      centresIntelligence[0]
    );
  }, [centresIntelligence, selectedCentreId]);

  // Center coordinate for the map (derived from farmer location)
  const mapCenter = useMemo(() => {
    return {
      lat: typeof farmerLocation?.lat === 'number' ? farmerLocation.lat : 28.5750,
      lng: typeof farmerLocation?.lng === 'number' ? farmerLocation.lng : 76.9200,
    };
  }, [farmerLocation]);

  // If real Google Maps API Key is provided, render using @vis.gl/react-google-maps
  if (hasApiKey) {
    return (
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <APIProvider apiKey={apiKey}>
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={mapCenter}
            defaultZoom={zoomLevel}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {/* Camera Synchronizer: updates camera on origin coordinate changes */}
            <MapCameraController origin={mapCenter} />

            {/* Scope controls inside Google Maps */}
            <GoogleMapControls origin={mapCenter} centres={centresIntelligence} />

            {/* Farmer's Location Marker */}
            <AdvancedMarker position={mapCenter} title="Your Farm Location">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-4 h-4 fill-white" />
                </div>
              </div>
            </AdvancedMarker>

            {/* Procurement Centre Markers */}
            {centresIntelligence.map((item) => {
              const { centre, distanceKm, isBestOverall } = item;
              const isSelected = centre.id === selectedCentreId;
              const isAvailable = centre.status === 'AVAILABLE';
              const isBusy = centre.status === 'BUSY';

              const bgColor = isBestOverall
                ? 'bg-emerald-600'
                : isAvailable
                ? 'bg-teal-600'
                : isBusy
                ? 'bg-orange-500'
                : 'bg-amber-600';

              const safeCoords =
                centre.coordinates && typeof centre.coordinates.lat === 'number'
                  ? centre.coordinates
                  : { lat: 28.6128, lng: 76.9856 };

              return (
                <AdvancedMarker
                  key={centre.id}
                  position={{ lat: safeCoords.lat, lng: safeCoords.lng }}
                  onClick={() => {
                    onSelectCentre(centre.id);
                    onOpenDetails(centre.id);
                  }}
                  title={centre.name}
                >
                  <div
                    className={`cursor-pointer transition-transform duration-150 transform hover:scale-110 ${
                      isSelected ? 'scale-110' : ''
                    }`}
                  >
                    <div
                      className={`px-2.5 py-1 rounded-xl text-white font-bold text-[11px] shadow-lg flex items-center gap-1.5 border-2 ${bgColor} ${
                        isSelected ? 'border-white ring-2 ring-emerald-500' : 'border-white'
                      }`}
                    >
                      <span>{centre.name.split(' ')[0]}</span>
                      <span className="font-mono bg-black/20 px-1 rounded text-[10px]">
                        {distanceKm}km
                      </span>
                      {isBestOverall && (
                        <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                      )}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        </APIProvider>

        {/* Top Left Floating Status Card */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/80 shadow-md text-white flex items-center gap-3 z-10 pointer-events-none sm:pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-white">Smart Procurement Map</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                {centresIntelligence.length} CENTRES ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Origin: {farmerLocation?.village || farmerLocation?.addressLabel || 'Farm'} • {farmerLocation?.district || ''}
            </p>
          </div>
        </div>

        {/* Bottom Floating Bar: Selected Centre Quick View */}
        {selectedIntelligence && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-700/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white z-10">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                  selectedIntelligence.isBestOverall
                    ? 'bg-emerald-600 ring-2 ring-emerald-400'
                    : 'bg-teal-600'
                }`}
              >
                {selectedIntelligence.smartMatchScore}
                <span className="text-[9px] block font-normal -mt-0.5">pts</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-white truncate">
                    {selectedIntelligence.centre.name}
                  </strong>
                  {selectedIntelligence.isBestOverall && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Best Choice
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 mt-0.5">
                  <span>
                    Distance: <strong className="text-white">{selectedIntelligence.distanceKm} km</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Travel: <strong className="text-white">~{selectedIntelligence.travelTimeMins} mins</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Queue Wait: <strong className="text-emerald-400">~{selectedIntelligence.currentWaitMins} mins</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <a
                href={buildGoogleMapsDirectionsUrl(
                  farmerLocation,
                  selectedIntelligence.centre.coordinates
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Get Directions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => onOpenDetails(selectedIntelligence.centre.id)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                View Centre Intelligence
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Graceful High-Fidelity Interactive Map Fallback (no external key needed)
  // Calculates SVG coordinates mathematically relative to farmer location
  return (
    <InteractiveVectorMap
      farmerLocation={farmerLocation}
      centresIntelligence={centresIntelligence}
      selectedCentreId={selectedCentreId}
      onSelectCentre={onSelectCentre}
      onOpenDetails={onOpenDetails}
    />
  );
};

interface VectorMapProps {
  farmerLocation: FarmerLocation;
  centresIntelligence: CentreIntelligence[];
  selectedCentreId: string;
  onSelectCentre: (centreId: string) => void;
  onOpenDetails: (centreId: string) => void;
}

const InteractiveVectorMap: React.FC<VectorMapProps> = ({
  farmerLocation,
  centresIntelligence,
  selectedCentreId,
  onSelectCentre,
  onOpenDetails,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [viewScope, setViewScope] = useState<'all' | 'nearby'>('all');
  const [hoveredCentreId, setHoveredCentreId] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const prevOriginRef = useRef<{ lat: number; lng: number } | null>(null);

  // Synchronize vector map viewport when farmer origin coordinates change
  useEffect(() => {
    const prev = prevOriginRef.current;
    if (!prev || prev.lat !== farmerLocation.lat || prev.lng !== farmerLocation.lng) {
      prevOriginRef.current = { lat: farmerLocation.lat, lng: farmerLocation.lng };
      setViewScope('nearby');
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [farmerLocation.lat, farmerLocation.lng]);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 440;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2 + 10;

  // Compute dynamic geographical bounds across all centres and farmer location
  const bounds = useMemo(() => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    const allPoints = [
      ...centresIntelligence.map((ci) => ci.centre.coordinates),
      { lat: farmerLocation.lat, lng: farmerLocation.lng },
    ].filter((c): c is GeoCoordinates => Boolean(c && typeof c.lat === 'number' && typeof c.lng === 'number'));

    if (allPoints.length === 0) {
      return { minLat: 16, maxLat: 32, minLng: 73, maxLng: 89 };
    }
    allPoints.forEach((p) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latSpan = Math.max(3, maxLat - minLat);
    const lngSpan = Math.max(3, maxLng - minLng);
    return {
      minLat: minLat - latSpan * 0.08,
      maxLat: maxLat + latSpan * 0.08,
      minLng: minLng - lngSpan * 0.08,
      maxLng: maxLng + lngSpan * 0.08,
    };
  }, [centresIntelligence, farmerLocation]);

  // Scaling for nearby mode: 1 degree lat ~ 111 km, 1 degree lng ~ 98 km
  const scale = 580 * zoom;

  // Convert lat/lng to SVG x,y relative to view scope and free pan offset
  const projectCoords = (coords?: GeoCoordinates | null) => {
    const cLat = typeof coords?.lat === 'number' ? coords.lat : 20.1250;
    const cLng = typeof coords?.lng === 'number' ? coords.lng : 77.1020;

    let basePoint = { x: centerX, y: centerY };
    if (viewScope === 'all') {
      const padX = 65;
      const padY = 55;
      const x = padX + ((cLng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (svgWidth - 2 * padX);
      const y = svgHeight - padY - ((cLat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (svgHeight - 2 * padY);
      basePoint = { x, y };
    } else {
      const fLat = typeof farmerLocation?.lat === 'number' ? farmerLocation.lat : 20.1250;
      const fLng = typeof farmerLocation?.lng === 'number' ? farmerLocation.lng : 77.1020;
      const dLng = cLng - fLng;
      const dLat = cLat - fLat;
      const x = centerX + dLng * scale * 0.9;
      const y = centerY - dLat * scale;
      basePoint = { x, y };
    }
    return {
      x: basePoint.x + panOffset.x,
      y: basePoint.y + panOffset.y,
    };
  };

  const farmerSvg = projectCoords({ lat: farmerLocation.lat, lng: farmerLocation.lng });

  const selectedIntelligence = useMemo(() => {
    return (
      centresIntelligence.find((c) => c.centre.id === selectedCentreId) ||
      centresIntelligence[0]
    );
  }, [centresIntelligence, selectedCentreId]);

  const selectedSvg = selectedIntelligence
    ? projectCoords(selectedIntelligence.centre?.coordinates)
    : null;

  return (
    <div className="relative w-full h-80 sm:h-96 md:h-[420px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 select-none">
      {/* Interactive SVG Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            setPanOffset({
              x: e.clientX - dragStartRef.current.x,
              y: e.clientY - dragStartRef.current.y,
            });
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
          </pattern>
          {/* Glowing Radial Gradient for Farmer radar */}
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          {/* Route Gradient */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Background Grid */}
        <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

        {/* Distance Range Circles (5km, 15km, 25km) */}
        {[
          { rKm: 8, label: '8 km zone' },
          { rKm: 18, label: '18 km zone' },
          { rKm: 28, label: '28 km zone' },
        ].map((circle) => {
          // approx 1 km = scale / 111 * (circle.rKm)
          const pxRadius = (circle.rKm / 111) * scale;
          return (
            <g key={circle.label}>
              <circle
                cx={centerX}
                cy={centerY}
                r={pxRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4,4"
                strokeWidth="1"
              />
              <text
                x={centerX + pxRadius - 28}
                y={centerY - 6}
                fill="rgba(255, 255, 255, 0.3)"
                fontSize="9"
                fontFamily="monospace"
              >
                {circle.label}
              </text>
            </g>
          );
        })}

        {/* Major Arterial Highway Lines (Simulated NCR Corridors) */}
        <path
          d={`M ${centerX - 240} ${centerY + 60} Q ${centerX} ${centerY - 40} ${centerX + 260} ${centerY - 80}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="3"
        />
        <path
          d={`M ${centerX - 180} ${centerY - 140} Q ${centerX + 20} ${centerY} ${centerX + 180} ${centerY + 160}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2.5"
        />

        {/* Route Line from Farmer to Selected Centre */}
        {selectedSvg && (
          <g>
            {/* Pulsing route backdrop */}
            <line
              x1={farmerSvg.x}
              y1={farmerSvg.y}
              x2={selectedSvg.x}
              y2={selectedSvg.y}
              stroke="#10b981"
              strokeWidth="4"
              strokeOpacity="0.4"
              strokeDasharray="8,6"
              className="animate-pulse"
            />
            {/* Main Crisp Route Line */}
            <line
              x1={farmerSvg.x}
              y1={farmerSvg.y}
              x2={selectedSvg.x}
              y2={selectedSvg.y}
              stroke="url(#routeGradient)"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* Farmer Location Radar Pin */}
        <g transform={`translate(${farmerSvg.x}, ${farmerSvg.y})`}>
          <circle r="28" fill="url(#radarGlow)" />
          <circle r="7" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="3" fill="#ffffff" />
          {/* Label */}
          <rect
            x="-48"
            y="12"
            width="96"
            height="18"
            rx="9"
            fill="#1e293b"
            stroke="#3b82f6"
            strokeWidth="1"
          />
          <text
            x="0"
            y="24"
            textAnchor="middle"
            fill="#93c5fd"
            fontSize="9"
            fontWeight="bold"
          >
            📍 {farmerLocation.village || 'Your Farm'}
          </text>
        </g>

        {/* Procurement Centre Markers */}
        {centresIntelligence.map((item) => {
          const { centre, distanceKm, travelTimeMins, smartMatchScore, isBestOverall, isNearest } =
            item;
          const pos = projectCoords(centre.coordinates);
          const isSelected = centre.id === selectedCentreId;
          const isHovered = centre.id === hoveredCentreId;

          const isAvailable = centre.status === 'AVAILABLE';
          const isBusy = centre.status === 'BUSY';

          const markerColor = isBestOverall
            ? '#10b981' // emerald
            : isAvailable
            ? '#0d9488' // teal
            : isBusy
            ? '#f97316' // orange
            : '#eab308'; // amber

          return (
            <g
              key={centre.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer"
              onClick={() => {
                onSelectCentre(centre.id);
                onOpenDetails(centre.id);
              }}
              onMouseEnter={() => setHoveredCentreId(centre.id)}
              onMouseLeave={() => setHoveredCentreId(null)}
            >
              {/* Outer halo when selected or best */}
              {(isSelected || isBestOverall) && (
                <circle
                  r={isSelected ? '24' : '20'}
                  fill="none"
                  stroke={markerColor}
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  className="animate-ping"
                />
              )}

              {/* Pin Base */}
              <circle
                r={isSelected ? '14' : '11'}
                fill={markerColor}
                stroke="#ffffff"
                strokeWidth={isSelected ? '3' : '2'}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
              />

              {/* Centre Icon / Score indicator */}
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize={isSelected ? '9' : '8'}
                fontWeight="900"
                fontFamily="sans-serif"
              >
                {centre.code.split('-')[0]}
              </text>

              {/* Callout Card Pill above Marker */}
              <g transform="translate(0, -22)">
                <rect
                  x="-58"
                  y="-12"
                  width="116"
                  height="22"
                  rx="11"
                  fill={isSelected ? '#0f172a' : 'rgba(15, 23, 42, 0.88)'}
                  stroke={isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.2)'}
                  strokeWidth={isSelected ? '1.5' : '1'}
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#cbd5e1'}
                  fontSize="9"
                  fontWeight="bold"
                >
                  {(centre?.name || 'Mandi').split(',')[0].slice(0, 14)} • {distanceKm}km
                </text>
              </g>

              {/* Best Overall Sparkle Badge */}
              {isBestOverall && (
                <g transform="translate(10, -26)">
                  <circle r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                  <text
                    x="0"
                    y="2.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="7"
                    fontWeight="bold"
                  >
                    ★
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Top Left Floating Status Card */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/80 shadow-md text-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
          <Navigation className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-white">Smart Procurement Map</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
              {centresIntelligence.length} CENTRES ACTIVE
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Origin: {farmerLocation?.village || farmerLocation?.addressLabel || 'Farm'} • {farmerLocation?.district || ''}
          </p>
        </div>
      </div>

      {/* Top Right Controls & Scope Switcher */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 text-xs font-semibold text-slate-300">
          <button
            onClick={() => {
              setViewScope('all');
              setPanOffset({ x: 0, y: 0 });
            }}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer text-[11px] ${
              viewScope === 'all'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'hover:text-white'
            }`}
          >
            All {centresIntelligence.length} Centres
          </button>
          <button
            onClick={() => {
              setViewScope('nearby');
              setPanOffset({ x: 0, y: 0 });
            }}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer text-[11px] ${
              viewScope === 'nearby'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'hover:text-white'
            }`}
          >
            My Region
          </button>
        </div>

        <div className="flex flex-col gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-md">
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.25))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Bar: Selected Centre Quick View */}
      {selectedIntelligence && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-700/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                selectedIntelligence.isBestOverall
                  ? 'bg-emerald-600 ring-2 ring-emerald-400'
                  : 'bg-teal-600'
              }`}
            >
              {selectedIntelligence.smartMatchScore}
              <span className="text-[9px] block font-normal -mt-0.5">pts</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-white truncate">
                  {selectedIntelligence.centre.name}
                </strong>
                {selectedIntelligence.isBestOverall && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Best Choice
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 mt-0.5">
                <span>
                  Distance: <strong className="text-white">{selectedIntelligence.distanceKm} km</strong>
                </span>
                <span>•</span>
                <span>
                  Travel: <strong className="text-white">~{selectedIntelligence.travelTimeMins} mins</strong>
                </span>
                <span>•</span>
                <span>
                  Queue Wait: <strong className="text-emerald-400">~{selectedIntelligence.currentWaitMins} mins</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <a
              href={buildGoogleMapsDirectionsUrl(
                farmerLocation,
                selectedIntelligence.centre.coordinates
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => onOpenDetails(selectedIntelligence.centre.id)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              View Centre Intelligence
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
