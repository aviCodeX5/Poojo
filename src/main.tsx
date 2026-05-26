import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (googleMapsApiKey && typeof window !== 'undefined') {
  (window as any).initGoogleMaps = () => {
    console.log('Google Maps loaded');
  };
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps`;
  document.head.appendChild(script);
} else {
  console.warn('VITE_GOOGLE_MAPS_API_KEY is not set. Google Maps will not load.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
