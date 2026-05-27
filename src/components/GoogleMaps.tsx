import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import OSM from 'ol/source/OSM.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import 'ol/ol.css';
import { Loader2, MapPin, Navigation, Search, X } from 'lucide-react';

interface Location {
  lat?: number;
  lng?: number;
  address: string;
  isManual?: boolean;
}

interface OpenLayersMapProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  className?: string;
}

type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
};

const DEFAULT_CENTER = { lat: 22.5726, lng: 88.3639 };

function markerStyle() {
  return new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color: '#2563eb' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
  });
}

async function reverseGeocode(lat: number, lng: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
  );
  const data: any = await response.json();
  return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

async function searchNominatim(query: string, limit = 5) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&addressdetails=1&q=${encodeURIComponent(query)}`
  );
  return await response.json() as SearchResult[];
}

export default function GoogleMaps({ onLocationSelect, initialLocation, className = '' }: OpenLayersMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerSourceRef = useRef(new VectorSource());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);

  const updateSelectedLocation = (location: Location, recenter = true) => {
    setSelectedLocation(location);
    onLocationSelect(location);

    if (location.lat === undefined || location.lng === undefined) return;

    const coordinate = fromLonLat([location.lng, location.lat]);
    markerSourceRef.current.clear();
    markerSourceRef.current.addFeature(new Feature({
      geometry: new Point(coordinate),
    }));

    if (recenter && mapRef.current) {
      mapRef.current.getView().animate({ center: coordinate, zoom: 16, duration: 250 });
    }
  };

  const chooseSearchResult = (result: SearchResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    updateSelectedLocation({
      lat,
      lng,
      address: result.display_name || searchQuery.trim(),
    });
    setSearchQuery(result.display_name || searchQuery.trim());
    setSearchResults([]);
    setSearchMessage('');
  };

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const center = initialLocation?.lat !== undefined && initialLocation.lng !== undefined
      ? fromLonLat([initialLocation.lng, initialLocation.lat])
      : fromLonLat([DEFAULT_CENTER.lng, DEFAULT_CENTER.lat]);

    const markerLayer = new VectorLayer({
      source: markerSourceRef.current,
      style: markerStyle(),
    });

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        markerLayer,
      ],
      view: new View({
        center,
        zoom: initialLocation ? 16 : 12,
      }),
    });

    map.on('click', async event => {
      const [lng, lat] = toLonLat(event.coordinate);
      setLoading(true);
      try {
        const address = await reverseGeocode(lat, lng);
        updateSelectedLocation({ lat, lng, address }, false);
      } catch {
        updateSelectedLocation({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }, false);
      } finally {
        setLoading(false);
      }
    });

    mapRef.current = map;

    if (initialLocation) {
      updateSelectedLocation(initialLocation, false);
    }

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      markerSourceRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchResults([]);
      setSearchMessage('');
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timeout = window.setTimeout(async () => {
      try {
        const results = await searchNominatim(query);
        if (cancelled) return;
        setSearchResults(results);
        setSearchMessage(results.length ? '' : 'No matching places found');
      } catch {
        if (!cancelled) {
          setSearchResults([]);
          setSearchMessage('Location suggestions are unavailable right now');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const [result] = await searchNominatim(searchQuery.trim(), 1);
      if (!result) {
        alert('Location not found. Please try a different search term.');
        return;
      }

      chooseSearchResult(result);
    } catch {
      alert('Location search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          updateSelectedLocation({ lat: latitude, lng: longitude, address });
        } catch {
          updateSelectedLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        alert('Unable to get your location. Please check your browser settings.');
      }
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
        OpenLayers map powered by OpenStreetMap. Search, use your current location, or click the map to select the pandal location.
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for pandal location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchMessage('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            role="combobox"
            aria-expanded={searchResults.length > 0}
            aria-controls="location-suggestions"
            aria-autocomplete="list"
            className="w-full pl-10 pr-4 py-2 border border-blue-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
          )}
          {(searchResults.length > 0 || searchMessage) && (
            <div
              id="location-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-xl"
            >
              {searchResults.map(result => (
                <button
                  key={`${result.lat}-${result.lon}-${result.display_name}`}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => chooseSearchResult(result)}
                  className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition-colors last:border-b-0 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <span className="block font-semibold text-slate-900">{result.display_name.split(',')[0]}</span>
                  <span className="mt-1 block text-xs text-slate-500">{result.display_name}</span>
                </button>
              ))}
              {!searchResults.length && searchMessage && (
                <div className="px-4 py-3 text-sm text-slate-500">{searchMessage}</div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={searchLocation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          title="Use current location"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          Locate me
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setSearchMessage('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-blue-50"
            aria-label="Clear location search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {selectedLocation && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Selected Location:</p>
              <p className="text-xs text-gray-600 mt-1 break-words">{selectedLocation.address}</p>
              {selectedLocation.lat !== undefined && selectedLocation.lng !== undefined && (
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={mapElementRef}
        className="w-full h-96 rounded-xl border border-blue-100 overflow-hidden bg-blue-50"
        style={{ minHeight: '400px' }}
        aria-label="OpenLayers OpenStreetMap location picker"
      />
    </div>
  );
}
