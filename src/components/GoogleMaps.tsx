import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';

interface Location {
  lat?: number;
  lng?: number;
  address: string;
  isManual?: boolean;
}

interface GoogleMapsProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  className?: string;
}

// Google Maps types
interface GoogleMapsWindow {
  maps: {
    Map: new (element: HTMLElement, options: any) => any;
    Marker: new (options: any) => any;
    Geocoder: new () => any;
    Animation: {
      DROP: number;
    };
  };
}

export default function GoogleMaps({ onLocationSelect, initialLocation, className = '' }: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleLoaded = () => {
      if (window.google && window.google.maps) {
        setGoogleLoaded(true);
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!googleLoaded) {
        setGoogleLoadError(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [googleLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !googleLoaded) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: initialLocation || { lat: 22.5726, lng: 88.3639 }, // Default: Kolkata
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(mapInstance);

    // Add click listener
    mapInstance.addListener('click', (e: any) => {
      const lat = e.latLng!.lat();
      const lng = e.latLng!.lng();
      
      // Geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const location = {
            lat,
            lng,
            address: results[0].formatted_address
          };
          setSelectedLocation(location);
          onLocationSelect(location);
          updateMarker(mapInstance, location);
        }
      });
    });

    // Set initial marker if location provided
    if (initialLocation) {
      updateMarker(mapInstance, initialLocation);
    }

    return () => {
      // Cleanup
    };
  }, [googleLoaded]);

  const updateMarker = (mapInstance: any, location: Location) => {
    if (marker) {
      marker.setMap(null);
    }

    const newMarker = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: mapInstance,
      title: location.address,
      animation: window.google.maps.Animation.DROP
    });

    setMarker(newMarker);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    if (!googleLoaded) {
      const manualLocation = {
        address: searchQuery.trim(),
        lat: 0,
        lng: 0,
        isManual: true,
      };
      setSelectedLocation(manualLocation);
      onLocationSelect(manualLocation);
      return;
    }

    setLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: searchQuery }, (results: any, status: string) => {
      setLoading(false);
      
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const address = results[0].formatted_address;
        
        const newLocation = {
          lat: location.lat(),
          lng: location.lng(),
          address
        };

        setSelectedLocation(newLocation);
        onLocationSelect(newLocation);
        
        if (map) {
          map.setCenter(location);
          map.setZoom(15);
          updateMarker(map, newLocation);
        }
      } else {
        alert('Location not found. Please try a different search term.');
      }
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: string) => {
          setLoading(false);
          
          if (status === 'OK' && results && results[0]) {
            const newLocation = {
              lat: latitude,
              lng: longitude,
              address: results[0].formatted_address
            };

            setSelectedLocation(newLocation);
            onLocationSelect(newLocation);
            
            if (map) {
              map.setCenter({ lat: latitude, lng: longitude });
              map.setZoom(15);
              updateMarker(map, newLocation);
            }
          }
        });
      },
      (error) => {
        setLoading(false);
        alert('Unable to get your location. Please check your browser settings.');
      }
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for pandal location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <button
          onClick={searchLocation}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Search
        </button>
        <button
          onClick={getCurrentLocation}
          disabled={loading || !googleLoaded}
          className="p-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
          title="Use current location"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>
      {googleLoadError && !googleLoaded && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          Google Maps could not be loaded. Enter your address above and click Search to continue with a manual location.
        </div>
      )}

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Selected Location:</p>
              <p className="text-xs text-gray-600 mt-1 break-words">{selectedLocation.address}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-xl border border-gray-200 overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {!window.google && (
        <div className="w-full h-96 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Google Maps is loading...</p>
            <p className="text-xs text-gray-400 mt-1">Make sure you have a valid API key</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Add TypeScript declaration for window.google
declare global {
  interface Window {
    google: any;
  }
}
